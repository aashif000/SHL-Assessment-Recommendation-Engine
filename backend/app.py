# app.py
import streamlit as st
import pandas as pd
import json
import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
import uvicorn
import requests
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import google.generativeai as genai
from bs4 import BeautifulSoup
import logging
from urllib.parse import urlparse

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure API key
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    api_key = st.secrets["GOOGLE_API_KEY"] if "GOOGLE_API_KEY" in st.secrets else None

# Configure Gemini
if api_key:
    genai.configure(api_key=api_key)
    generation_config = {
        "temperature": 0.2,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 1024,
    }
    model = genai.GenerativeModel(model_name="gemini-1.5-pro", generation_config=generation_config)

# Define assessment data structure
class Assessment(BaseModel):
    name: str
    url: str
    remoteTestingSupport: bool
    adaptiveIRTSupport: bool
    duration: str
    testType: str

class RecommendationRequest(BaseModel):
    query: str
    max_results: Optional[int] = 10

class RecommendationResponse(BaseModel):
    recommendations: List[Assessment]
    query: str

# Load assessments data
def load_assessments():
    """Load assessments from a JSON file or initialize with seed data"""
    try:
        with open('assessments.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Initialize with seed data
        assessments = [
            {
                "name": "Automata - Fix (New) | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/automata-fix-new/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": False,
                "duration": "30 minutes",
                "testType": "Technical"
            },
            {
                "name": "Core Java (Entry Level) (New) | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/core-java-entry-level-new/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": False,
                "duration": "35 minutes",
                "testType": "Technical"
            },
            {
                "name": "Java 8 (New) | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/java-8-new/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": False,
                "duration": "40 minutes",
                "testType": "Technical"
            },
            # Add all the SHL assessments from the provided data
            # This is just a sample, you should add all assessments
            {
                "name": "Core Java (Advanced Level) (New) | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/core-java-advanced-level-new/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": False,
                "duration": "40 minutes",
                "testType": "Technical"
            },
            {
                "name": "Agile Software Development | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/agile-software-development/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": False,
                "duration": "30 minutes",
                "testType": "Methodology"
            },
            {
                "name": "Technology Professional 8.0 Job Focused Assessment | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/technology-professional-8-0-job-focused-assessment/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": True,
                "duration": "45 minutes",
                "testType": "Comprehensive"
            },
            {
                "name": "Computer Science (New) | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/computer-science-new/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": False,
                "duration": "35 minutes",
                "testType": "Technical"
            },
            {
                "name": "Entry level Sales 7.1 (International) | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/entry-level-sales-7-1/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": True,
                "duration": "45 minutes",
                "testType": "Sales"
            },
            {
                "name": "Entry Level Sales Sift Out 7.1 | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/entry-level-sales-sift-out-7-1/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": True,
                "duration": "30 minutes",
                "testType": "Sales"
            },
            {
                "name": "Entry Level Sales Solution | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/entry-level-sales-solution/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": True,
                "duration": "60 minutes",
                "testType": "Sales"
            },
            {
                "name": "Sales Representative Solution | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/sales-representative-solution/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": True,
                "duration": "55 minutes",
                "testType": "Sales"
            },
            {
                "name": "Sales Support Specialist Solution | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/sales-support-specialist-solution/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": True,
                "duration": "50 minutes",
                "testType": "Sales"
            },
            {
                "name": "Technical Sales Associate Solution | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/technical-sales-associate-solution/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": True,
                "duration": "60 minutes",
                "testType": "Sales Technical"
            },
            {
                "name": "SVAR - Spoken English (Indian Accent) (New) | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/svar-spoken-english-indian-accent-new/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": False,
                "duration": "25 minutes",
                "testType": "Language"
            },
            {
                "name": "Sales & Service Phone Solution | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/sales-and-service-phone-solution/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": True,
                "duration": "55 minutes",
                "testType": "Sales Service"
            },
            {
                "name": "Sales & Service Phone Simulation | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/sales-and-service-phone-simulation/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": False,
                "duration": "45 minutes",
                "testType": "Sales Simulation"
            },
            {
                "name": "English Comprehension (New) | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/english-comprehension-new/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": False,
                "duration": "30 minutes",
                "testType": "Language"
            },
            {
                "name": "Motivation Questionnaire MQM5 | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/motivation-questionnaire-mqm5/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": False,
                "duration": "25 minutes",
                "testType": "Personality"
            },
            {
                "name": "Global Skills Assessment | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/global-skills-assessment/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": True,
                "duration": "60 minutes",
                "testType": "Comprehensive"
            },
            {
                "name": "Graduate 8.0 Job Focused Assessment | SHL",
                "url": "https://www.shl.com/solutions/products/product-catalog/view/graduate-8-0-job-focused-assessment-4228/",
                "remoteTestingSupport": True,
                "adaptiveIRTSupport": True,
                "duration": "50 minutes",
                "testType": "Comprehensive"
            },
            # Add all 39 assessments from the dataset
        ]
        # Save to file for future use
        with open('assessments.json', 'w') as f:
            json.dump(assessments, f)
        return assessments

# Load the test queries for evaluation
def load_test_queries():
    return [
        {
            "query": "I am hiring for Java developers who can also collaborate effectively with my business teams. Looking for an assessment(s) that can be completed in 40 minutes.",
            "relevantAssessments": [
                "Automata - Fix (New) | SHL",
                "Core Java (Entry Level) (New) | SHL",
                "Java 8 (New) | SHL",
                "Core Java (Advanced Level) (New) | SHL",
                "Agile Software Development | SHL", 
                "Technology Professional 8.0 Job Focused Assessment | SHL",
                "Computer Science (New) | SHL"
            ]
        },
        {
            "query": "I want to hire new graduates for a sales role in my company, the budget is for about an hour for each test. Give me some options",
            "relevantAssessments": [
                "Entry level Sales 7.1 (International) | SHL",
                "Entry Level Sales Sift Out 7.1 | SHL",
                "Entry Level Sales Solution | SHL",
                "Sales Representative Solution | SHL",
                "Sales Support Specialist Solution | SHL",
                "Technical Sales Associate Solution | SHL",
                "SVAR - Spoken English (Indian Accent) (New) | SHL",
                "Sales & Service Phone Solution | SHL",
                "Sales & Service Phone Simulation | SHL",
                "English Comprehension (New) | SHL"
            ]
        },
        {
            "query": "I am looking for a COO for my company in China and I want to see if they are culturally a right fit for our company. Suggest me an assessment that they can complete in about an hour",
            "relevantAssessments": [
                "Motivation Questionnaire MQM5 | SHL",
                "Global Skills Assessment | SHL",
                "Graduate 8.0 Job Focused Assessment | SHL"
            ]
        },
        {
            "query": "Content Writer required, expert in English and SEO.",
            "relevantAssessments": [
                "Drupal (New) | SHL",
                "Search Engine Optimization (New) | SHL",
                "Administrative Professional - Short Form | SHL",
                "Entry Level Sales Sift Out 7.1 | SHL",
                "General Entry Level – Data Entry 7.0 Solution | SHL"
            ]
        }
    ]

# Fetch content from a URL
def fetch_url_content(url: str) -> str:
    """Fetch content from a URL and return it as text"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract text from the page
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text
        text = soup.get_text(separator='\n')
        
        # Break into lines and remove leading and trailing space on each
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Remove blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return text
    except Exception as e:
        logger.error(f"Error fetching URL {url}: {str(e)}")
        return f"Failed to fetch content from URL: {str(e)}"

# Rule-based recommendation system
def rule_based_recommendations(query: str, assessments: List[dict], max_results: int = 10) -> List[dict]:
    """Generate recommendations based on rule-based matching"""
    
    # Extract potential requirements from the query
    query_lower = query.lower()
    
    # Calculate a relevance score for each assessment
    scored_assessments = []
    
    for assessment in assessments:
        score = 0
        name_lower = assessment["name"].lower()
        type_lower = assessment["testType"].lower()
        duration = assessment["duration"].split()[0]  # Extract just the number
        
        # Technical skills matching
        technical_skills = ["java", "javascript", "js", "python", "sql", "html", "css", "selenium"]
        for skill in technical_skills:
            if skill in query_lower and (skill in name_lower or "technical" in type_lower):
                score += 5
        
        # Role-based matching
        roles = {
            "developer": ["technical", "developer", "coding"],
            "sales": ["sales", "service"],
            "manager": ["management", "leadership"],
            "writer": ["content", "writing"],
            "qa": ["quality", "testing", "qa"],
            "admin": ["administrative", "admin"],
            "analyst": ["analyst", "analysis"],
            "coo": ["leadership", "management"],
            "executive": ["leadership", "management"]
        }
        
        for role, keywords in roles.items():
            if role in query_lower:
                for keyword in keywords:
                    if keyword in type_lower or keyword in name_lower:
                        score += 3
        
        # Duration constraints
        if "minutes" in assessment["duration"]:
            try:
                assessment_duration = int(duration)
                
                # Check for specific duration constraints
                if "less than" in query_lower or "under" in query_lower or "within" in query_lower or "at most" in query_lower or "max" in query_lower:
                    # Try to extract the maximum time allowed
                    import re
                    time_patterns = [
                        r"(?:less than|under|within|at most|max|maximum)\s+(\d+)\s*(?:min|mins|minutes)",
                        r"(?:less than|under|within|at most|max|maximum)\s+(\d+)",
                        r"(\d+)\s*(?:min|mins|minutes)\s*(?:or less|maximum|max)",
                    ]
                    
                    for pattern in time_patterns:
                        match = re.search(pattern, query_lower)
                        if match:
                            max_minutes = int(match.group(1))
                            if assessment_duration <= max_minutes:
                                score += 5
                            else:
                                score -= 10  # Severe penalty for exceeding max time
                            break
                
                # Check for "about X hour" patterns
                if "hour" in query_lower or "hours" in query_lower:
                    hour_patterns = [
                        r"(?:about|around|approximately)\s+(\d+)\s*(?:hour|hours)",
                        r"(\d+)\s*(?:hour|hours)"
                    ]
                    
                    for pattern in hour_patterns:
                        match = re.search(pattern, query_lower)
                        if match:
                            hours = int(match.group(1))
                            target_minutes = hours * 60
                            # Allow ±15 minutes tolerance
                            if abs(assessment_duration - target_minutes) <= 15:
                                score += 5
                            break
                            
                # Direct duration match
                duration_match = f"{duration} minutes" in query_lower or f"{duration} mins" in query_lower
                if duration_match:
                    score += 3
                    
            except ValueError:
                pass  # Duration not a straightforward number
        
        # Add a bias for assessments with matching keywords in name
        query_terms = query_lower.split()
        for term in query_terms:
            if len(term) > 3 and term in name_lower:
                score += 2
        
        scored_assessments.append((assessment, score))
    
    # Sort by score in descending order
    scored_assessments.sort(key=lambda x: x[1], reverse=True)
    
    # Return top N results
    return [item[0] for item in scored_assessments[:max_results]]

# LLM-based recommendation system using Google Gemini
def gemini_recommendations(query: str, assessments: List[dict], max_results: int = 10) -> List[dict]:
    """Generate recommendations using Google Gemini AI"""
    if not api_key:
        return rule_based_recommendations(query, assessments, max_results)
    
    try:
        # Create a prompt for Gemini that includes assessment information
        assessment_descriptions = "\n".join([
            f"Name: {a['name']}, Type: {a['testType']}, Duration: {a['duration']}" 
            for a in assessments
        ])
        
        prompt = f"""
        You are an expert AI assistant specializing in SHL assessment tests for hiring.
        
        Given the following job description or query:
        "{query}"
        
        And this list of available SHL assessments:
        {assessment_descriptions}
        
        Please recommend the most relevant SHL assessments from the list. Follow these specific guidelines:
        1. Consider any duration constraints mentioned in the query (e.g., "less than 30 minutes", "within 45 mins").
        2. Focus on technical skills, job roles, and other requirements mentioned.
        3. Pay special attention to any specific technical skills (Java, Python, JavaScript, etc.) mentioned.
        4. Consider administrative, sales, or other specialized roles mentioned.
        
        Return your response as a JSON list with the following format:
        {{"recommendations": ["Full Assessment Name 1", "Full Assessment Name 2", "Full Assessment Name 3"]}}
        
        Only return assessment names that exactly match those in the list I provided. Include no more than {max_results} assessments and rank them by relevance to the query.
        """
        
        # Call Gemini model
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Extract JSON part
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            logger.warning("Could not extract JSON from Gemini response")
            return rule_based_recommendations(query, assessments, max_results)
            
        json_response = json.loads(json_match.group(0))
        recommended_names = json_response.get('recommendations', [])
        
        # Match names to assessment objects
        recommended_assessments = []
        for name in recommended_names:
            for assessment in assessments:
                if assessment["name"] == name:
                    recommended_assessments.append(assessment)
                    break
        
        # If no exact matches were found, try partial matching
        if not recommended_assessments:
            for name in recommended_names:
                name_lower = name.lower().replace(' | shl', '').strip()
                for assessment in assessments:
                    assessment_name_lower = assessment["name"].lower().replace(' | shl', '').strip()
                    if name_lower in assessment_name_lower or assessment_name_lower in name_lower:
                        if assessment not in recommended_assessments:
                            recommended_assessments.append(assessment)
        
        # If we still don't have results, fall back to rule-based approach
        if not recommended_assessments:
            logger.warning("No matches found from Gemini recommendations, falling back to rule-based")
            return rule_based_recommendations(query, assessments, max_results)
        
        return recommended_assessments[:max_results]
        
    except Exception as e:
        logger.error(f"Error using Gemini for recommendations: {str(e)}")
        # Fall back to rule-based approach
        return rule_based_recommendations(query, assessments, max_results)

# Combined recommendation function
def get_recommendations(query: str, assessments: List[dict], max_results: int = 10) -> List[dict]:
    """Get recommendations using the best available method"""
    
    # Check if the input might be a URL
    is_url = False
    try:
        parsed = urlparse(query)
        is_url = all([parsed.scheme, parsed.netloc])
    except:
        is_url = False
    
    # If it's a URL, fetch the content
    if is_url:
        content = fetch_url_content(query)
        if content and not content.startswith("Failed"):
            query = content
    
    # Try Gemini first, fall back to rule-based if needed
    if api_key:
        try:
            return gemini_recommendations(query, assessments, max_results)
        except Exception as e:
            logger.error(f"Error with Gemini recommendations: {str(e)}")
            return rule_based_recommendations(query, assessments, max_results)
    else:
        return rule_based_recommendations(query, assessments, max_results)

# Create FastAPI app
api = FastAPI(title="SHL Assessment Recommendation API")

# Add health check endpoint
@api.get("/health", tags=["System"])
def health_check():
    """Health check endpoint"""
    return {"status": "OK", "message": "API is running"}

# Add recommendation endpoint
@api.post("/recommend", response_model=RecommendationResponse, tags=["Recommendations"])
def recommend(request: RecommendationRequest):
    """Get assessment recommendations"""
    assessments = load_assessments()
    recommendations = get_recommendations(request.query, assessments, request.max_results or 10)
    
    # Convert to required response format
    return {
        "recommendations": recommendations,
        "query": request.query
    }

# Evaluation functions
def calculate_recall_at_k(relevant: List[str], recommended: List[dict], k: int) -> float:
    """Calculate Recall@K"""
    if not relevant:
        return 1.0  # No relevant items means perfect recall
    
    hits = 0
    for item in recommended[:k]:
        if item["name"] in relevant:
            hits += 1
    
    return hits / len(relevant)

def calculate_precision_at_k(relevant: List[str], recommended: List[dict], k: int) -> float:
    """Calculate Precision@K"""
    if k == 0:
        return 0.0
        
    hits = 0
    for item in recommended[:min(k, len(recommended))]:
        if item["name"] in relevant:
            hits += 1
    
    return hits / min(k, len(recommended))

def calculate_ap_at_k(relevant: List[str], recommended: List[dict], k: int) -> float:
    """Calculate Average Precision@K"""
    if not relevant:
        return 1.0  # No relevant items means perfect precision
    
    hits = 0
    sum_precisions = 0.0
    
    for i, item in enumerate(recommended[:k]):
        if item["name"] in relevant:
            hits += 1
            precision_at_i = hits / (i + 1)
            sum_precisions += precision_at_i
    
    if hits == 0:
        return 0.0
        
    return sum_precisions / min(len(relevant), k)

def evaluate_model(k: int = 3) -> Dict[str, float]:
    """Evaluate the recommendation model"""
    assessments = load_assessments()
    test_queries = load_test_queries()
    
    recall_scores = []
    ap_scores = []
    
    for test_case in test_queries:
        query = test_case["query"]
        relevant_assessments = test_case["relevantAssessments"]
        
        # Get recommendations
        recommendations = get_recommendations(query, assessments, 10)
        
        # Calculate Recall@K
        recall = calculate_recall_at_k(relevant_assessments, recommendations, k)
        recall_scores.append(recall)
        
        # Calculate AP@K
        ap = calculate_ap_at_k(relevant_assessments, recommendations, k)
        ap_scores.append(ap)
    
    mean_recall = sum(recall_scores) / len(recall_scores) if recall_scores else 0
    map_score = sum(ap_scores) / len(ap_scores) if ap_scores else 0
    
    return {
        "mean_recall_at_k": mean_recall,
        "map_at_k": map_score,
        "k": k,
        "num_queries": len(test_queries)
    }

# Streamlit UI
def streamlit_app():
    st.set_page_config(page_title="SHL Assessment Recommendation System", layout="wide")
    
    # Custom styling
    st.markdown("""
    <style>
    .main-header {
        font-size: 2.5rem;
        color: #003366;
        text-align: center;
    }
    .sub-header {
        font-size: 1.5rem;
        color: #0066cc;
        margin-bottom: 1rem;
    }
    .success-text {
        color: #009900;
    }
    .info-box {
        background-color: #f0f7fb;
        border-left: 5px solid #0099cc;
        padding: 10px;
        margin: 10px 0;
    }
    .api-docs {
        background-color: #f5f5f5;
        border-radius: 5px;
        padding: 15px;
        margin: 10px 0;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Header
    st.markdown('<p class="main-header">SHL Assessment Recommendation System</p>', unsafe_allow_html=True)
    
    # Initialize session state for results
    if 'results' not in st.session_state:
        st.session_state.results = None
    if 'query' not in st.session_state:
        st.session_state.query = ""
    if 'evaluation_results' not in st.session_state:
        st.session_state.evaluation_results = None
    
    # Tabs for different functionality
    tab1, tab2, tab3, tab4 = st.tabs(["Recommendations", "API Documentation", "Evaluation", "About"])
    
    # Recommendations tab
    with tab1:
        st.markdown('<p class="sub-header">Find the Right Assessments for Your Hiring Needs</p>', unsafe_allow_html=True)
        
        # API key input
        with st.expander("API Key Settings", expanded=not api_key):
            user_api_key = st.text_input("Enter Google Gemini API Key (optional)", 
                                         value=api_key if api_key else "", 
                                         type="password",
                                         help="Without an API key, the system will use rule-based matching only.")
            if user_api_key and user_api_key != api_key:
                try:
                    genai.configure(api_key=user_api_key)
                    model = genai.GenerativeModel(model_name="gemini-1.5-pro", generation_config=generation_config)
                    st.success("API key configured successfully!")
                except Exception as e:
                    st.error(f"Failed to configure API key: {str(e)}")
        
        # Input options
        input_type = st.radio("Select input type:", ["Natural Language Query", "Job Description", "URL"])
        
        if input_type == "Natural Language Query":
            query = st.text_area("Enter your query:", 
                                height=100,
                                placeholder="e.g., I am hiring for Java developers who can collaborate with business teams. Looking for assessments within 40 minutes.")
        
        elif input_type == "Job Description":
            query = st.text_area("Paste job description:", 
                                height=300,
                                placeholder="Paste the full job description here...")
        
        elif input_type == "URL":
            query = st.text_input("Enter URL to job posting:", 
                                placeholder="https://example.com/job-posting")
            if query and query.startswith("http"):
                with st.expander("URL Content Preview"):
                    content = fetch_url_content(query)
                    st.text_area("Content Preview", value=content[:500] + "...", height=150)
        
        # Sample queries for demonstration
        with st.expander("Try Sample Queries"):
            sample_queries = [
                "I am hiring for Java developers who can collaborate effectively with business teams. Looking for assessments within 40 minutes.",
                "I want to hire new graduates for a sales role, the budget is for about an hour for each test.",
                "I am looking for a COO for my company and I want to see if they are culturally a right fit.",
                "Content Writer required, expert in English and SEO.",
                "Looking to hire mid-level professionals proficient in Python, SQL and JavaScript with max duration of 60 minutes."
            ]
            
            for i, sample in enumerate(sample_queries):
                if st.button(f"Sample {i+1}", key=f"sample_{i}"):
                    query = sample
                    st.session_state.query = sample
                    st.experimental_rerun()
        
        # Set the query from session state if available
        if st.session_state.query and not query:
            query = st.session_state.query
            st.session_state.query = ""  # Clear it after use
        
        # Settings
        with st.expander("Advanced Settings"):
            max_results = st.slider("Maximum number of recommendations", min_value=1, max_value=10, value=5)
        
        # Submit button
        if st.button("Get Recommendations", type="primary", use_container_width=True):
            if query:
                # Show a spinner while processing
                with st.spinner("Finding the best assessments for your needs..."):
                    # Load assessments
                    assessments = load_assessments()
                    
                    # Get recommendations
                    recommendations = get_recommendations(query, assessments, max_results)
                    
                    # Store results
                    st.session_state.results = recommendations
                    
                    # Create a pandas DataFrame for display
                    results_data = []
                    for rec in recommendations:
                        results_data.append({
                            "Assessment Name": rec["name"].replace(" | SHL", ""),
                            "Type": rec["testType"],
                            "Duration": rec["duration"],
                            "Remote Testing": "Yes" if rec["remoteTestingSupport"] else "No",
                            "Adaptive IRT": "Yes" if rec["adaptiveIRTSupport"] else "No",
                            "URL": rec["url"]
                        })
                    
                    results_df = pd.DataFrame(results_data)
                
                # Show results header
                st.markdown(f'<p class="sub-header">Top {len(recommendations)} Recommendations</p>', unsafe_allow_html=True)
                
                # Display recommendations as a table
                st.data_editor(
                    results_df,
                    column_config={
                        "Assessment Name": st.column_config.TextColumn("Assessment Name"),
                        "Type": st.column_config.TextColumn("Type"),
                        "Duration": st.column_config.TextColumn("Duration"),
                        "Remote Testing": st.column_config.TextColumn("Remote Testing"),
                        "Adaptive IRT": st.column_config.TextColumn("Adaptive IRT"),
                        "URL": st.column_config.LinkColumn("URL")
                    },
                    use_container_width=True,
                    disabled=True,
                    hide_index=True,
                )
                
                # Show method used
                if api_key:
                    st.info("Recommendations generated using Google Gemini AI with rule-based fallback.")
                else:
                    st.info("Recommendations generated using rule-based matching. For better results, add a Gemini API key.")
            else:
                st.error("Please enter a query, job description, or URL.")
    
    # API Documentation tab
    with tab2:
        st.markdown('<p class="sub-header">API Documentation</p>', unsafe_allow_html=True)
        
        st.markdown("""
        <div class="info-box">
        This API provides endpoints for retrieving SHL assessment recommendations based on natural language queries and job descriptions.
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown('<p class="sub-header">Endpoints</p>', unsafe_allow_html=True)
        
        st.markdown("""
        <div class="api-docs">
        <h3>1. Health Check</h3>
        <pre><code>GET /health</code></pre>
        <p>Returns the current status of the API.</p>
        <p><strong>Response Example:</strong></p>
        <pre><code>
        {
            "status": "OK",
            "message": "API is running"
        }
        </code></pre>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="api-docs">
        <h3>2. Get Recommendations</h3>
        <pre><code>POST /recommend</code></pre>
        <p>Returns assessment recommendations based on the provided query.</p>
        
        <p><strong>Request Body:</strong></p>
        <pre><code>
        {
            "query": "string",
            "max_results": 10
        }
        </code></pre>
        
        <p><strong>Response Example:</strong></p>
        <pre><code>
        {
            "recommendations": [
                {
                    "name": "Core Java (Entry Level) (New) | SHL",
                    "url": "https://www.shl.com/solutions/products/product-catalog/view/core-java-entry-level-new/",
                    "remoteTestingSupport": true,
                    "adaptiveIRTSupport": false,
                    "duration": "35 minutes",
                    "testType": "Technical"
                },
                ...
            ],
            "query": "I need Java developers"
        }
        </code></pre>
        </div>
        """, unsafe_allow_html=True)
        
        # API Test Form
        st.markdown('<p class="sub-header">Try the API</p>', unsafe_allow_html=True)
        
        test_query = st.text_area("Enter a query for testing:", height=100, 
                                  placeholder="e.g., Looking for Java developers with good communication skills")
        
        if st.button("Test API", key="test_api"):
            if test_query:
                with st.spinner("Calling API..."):
                    # Call the API function directly
                    req = RecommendationRequest(query=test_query)
                    response = recommend(req)
                    
                    # Convert to JSON for display
                    response_json = json.dumps(response, indent=2)
                    
                    st.code(response_json, language="json")
            else:
                st.error("Please enter a query for testing.")
    
    # Evaluation tab
    with tab3:
        st.markdown('<p class="sub-header">Evaluation Metrics</p>', unsafe_allow_html=True)
        
        st.markdown("""
        <div class="info-box">
        This section shows the performance of the recommendation system on a test set of queries.
        We evaluate using standard information retrieval metrics: Mean Recall@K and MAP@K.
        </div>
        """, unsafe_allow_html=True)
        
        k_value = st.slider("K value for evaluation", min_value=1, max_value=10, value=3)
        
        if st.button("Run Evaluation", key="run_eval", use_container_width=True):
            with st.spinner("Running evaluation..."):
                # Run evaluation
                eval_results = evaluate_model(k=k_value)
                st.session_state.evaluation_results = eval_results
        
        # Display evaluation results
        if st.session_state.evaluation_results:
            results = st.session_state.evaluation_results
            
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Mean Recall@K", f"{results['mean_recall_at_k']:.4f}")
            with col2:
                st.metric("MAP@K", f"{results['map_at_k']:.4f}")
            
            st.info(f"Evaluation performed on {results['num_queries']} test queries with K={results['k']}")
            
            # Show test queries
            st.markdown("### Test Queries")
            test_queries = load_test_queries()
            
            for i, test_case in enumerate(test_queries):
                with st.expander(f"Test Query {i+1}"):
                    st.write(f"**Query:** {test_case['query']}")
                    st.write("**Relevant Assessments:**")
                    for assessment in test_case['relevantAssessments']:
                        st.write(f"- {assessment}")
    
    # About tab
    with tab4:
        st.markdown('<p class="sub-header">About this System</p>', unsafe_allow_html=True)
        
        st.markdown("""
        <div class="info-box">
        <p>The SHL Assessment Recommendation System is designed to help hiring managers find the most suitable assessments for their roles quickly and efficiently.</p>
        </div>
        
        <h3>How it Works</h3>
        <p>The system uses a combination of techniques:</p>
        <ol>
            <li><strong>Natural Language Processing:</strong> Analyzes queries to understand requirements</li>
            <li><strong>Rule-Based Matching:</strong> Uses domain knowledge to match assessments with skills</li>
            <li><strong>Google Gemini AI:</strong> Leverages advanced LLMs for semantic understanding (when API key provided)</li>
            <li><strong>Duration & Role Matching:</strong> Considers time constraints and role specifics</li>
        </ol>
        
        <h3>System Features</h3>
        <ul>
            <li>Natural language query understanding</li>
            <li>Job description analysis</li>
            <li>Web URL content extraction</li>
            <li>REST API for integration</li>
            <li>Evaluation metrics for quality assessment</li>
        </ul>
        """, unsafe_allow_html=True)

def main():
    if "streamlit" in sys.modules or "streamlit.web" in sys.modules or "_STREAMLIT_" in os.environ:
        streamlit_app()
    else:
        # Run FastAPI app
        uvicorn.run(api, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    # Check if running as Streamlit or FastAPI
    import sys
    main()
