You can run the Streamlit interface with:

streamlit run app.py


And access the API separately with:

uvicorn app:api --reload


The code automatically detects whether it's being run as Streamlit or standalone API.