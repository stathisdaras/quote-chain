"""
Simple test script for the Highlights API
"""
import requests
import json
import os

API_URL = "http://localhost:8000"


def test_store_highlights():
    """Test storing highlights from CSV file"""
    url = f"{API_URL}/highlights"
    
    # Check if sample CSV exists
    csv_file = os.path.join(os.path.dirname(__file__), "sample_highlights.csv")
    if not os.path.exists(csv_file):
        print(f"❌ Error: {csv_file} not found. Please create a CSV file with columns: Highlight, Book Title, Book Author, Document Tags")
        return
    
    with open(csv_file, 'rb') as f:
        files = {'file': (csv_file, f, 'text/csv')}
        response = requests.post(url, files=files)
    
    print("Store Highlights Response:")
    print(json.dumps(response.json(), indent=2))
    print()


def test_search():
    """Test semantic search"""
    url = f"{API_URL}/search"
    data = {
        "prompt": "What did Steve Jobs say about work and passion?",
        "limit": 3
    }
    
    response = requests.post(url, json=data)
    print("Search Response (no tag filter):")
    print(json.dumps(response.json(), indent=2))
    print()


def test_search_with_tags():
    """Test semantic search with tag filtering"""
    url = f"{API_URL}/search"
    data = {
        "prompt": "What did Steve Jobs say about work?",
        "limit": 5,
        "tags": ["philosophy", "work"]
    }
    
    response = requests.post(url, json=data)
    print("Search Response (with tag filter: philosophy, work):")
    print(json.dumps(response.json(), indent=2))
    print()


def test_count():
    """Test getting highlights count"""
    url = f"{API_URL}/highlights/count"
    response = requests.get(url)
    print("Highlights Count:")
    print(json.dumps(response.json(), indent=2))
    print()


if __name__ == "__main__":
    print("Testing Highlights API\n")
    print("=" * 50)
    
    # Test storing highlights
    print("\n1. Testing store highlights...")
    test_store_highlights()
    
    # Test search
    print("\n2. Testing semantic search...")
    test_search()
    
    # Test search with tags
    print("\n3. Testing semantic search with tag filtering...")
    test_search_with_tags()
    
    # Test count
    print("\n4. Testing highlights count...")
    test_count()
    
    print("=" * 50)
    print("\nTests completed!")

