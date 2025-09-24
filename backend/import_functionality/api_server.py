"""
Flask API server for resume parsing
This server provides an HTTP endpoint to parse resumes using the resume_parser.py module
"""

import os
import json
import base64
import tempfile
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from resume_parser import ResumeParser
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the resume parser
parser = ResumeParser()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'resume-parser-api'})


@app.route('/parse-resume', methods=['POST'])
def parse_resume():
    """
    Parse a resume from base64 encoded file content

    Expected JSON payload:
    {
        "fileContent": "base64_encoded_string",
        "fileName": "resume.pdf",
        "fileType": "application/pdf"
    }
    """
    try:
        data = request.json

        if not data or 'fileContent' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing fileContent in request'
            }), 400

        file_content = data['fileContent']
        file_name = data.get('fileName', 'resume.pdf')
        file_type = data.get('fileType', '')

        # Determine file extension
        if file_name.endswith('.pdf') or 'pdf' in file_type:
            extension = '.pdf'
        elif file_name.endswith('.docx') or 'word' in file_type:
            extension = '.docx'
        else:
            return jsonify({
                'success': False,
                'error': 'Unsupported file type. Only PDF and DOCX are supported.'
            }), 400

        # Decode base64 content
        try:
            file_bytes = base64.b64decode(file_content)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Invalid base64 encoding: {str(e)}'
            }), 400

        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=extension, delete=False) as tmp_file:
            tmp_file.write(file_bytes)
            tmp_file_path = tmp_file.name

        try:
            # Parse the resume
            parsed_data = parser.parse_resume(tmp_file_path)

            return jsonify({
                'success': True,
                'data': parsed_data,
                'message': 'Resume parsed successfully'
            })

        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.remove(tmp_file_path)

    except Exception as e:
        app.logger.error(f"Error parsing resume: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/parse-resume-url', methods=['POST'])
def parse_resume_url():
    """
    Parse a resume from a URL (alternative endpoint)

    Expected JSON payload:
    {
        "url": "https://example.com/resume.pdf"
    }
    """
    try:
        data = request.json

        if not data or 'url' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing url in request'
            }), 400

        url = data['url']

        # Download file from URL
        import requests
        response = requests.get(url, timeout=30)

        if response.status_code != 200:
            return jsonify({
                'success': False,
                'error': f'Failed to download file from URL: {response.status_code}'
            }), 400

        # Determine extension from URL or content-type
        if url.endswith('.pdf') or 'pdf' in response.headers.get('content-type', ''):
            extension = '.pdf'
        elif url.endswith('.docx') or 'word' in response.headers.get('content-type', ''):
            extension = '.docx'
        else:
            return jsonify({
                'success': False,
                'error': 'Could not determine file type from URL'
            }), 400

        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=extension, delete=False) as tmp_file:
            tmp_file.write(response.content)
            tmp_file_path = tmp_file.name

        try:
            # Parse the resume
            parsed_data = parser.parse_resume(tmp_file_path)

            return jsonify({
                'success': True,
                'data': parsed_data,
                'message': 'Resume parsed successfully'
            })

        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.remove(tmp_file_path)

    except Exception as e:
        app.logger.error(f"Error parsing resume from URL: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    # Run the server (default to 5001 to avoid conflict with macOS AirPlay)
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'

    print(f"Starting Resume Parser API server on port {port}")
    print(f"Debug mode: {debug}")
    print("\nEndpoints:")
    print(f"  GET  http://localhost:{port}/health")
    print(f"  POST http://localhost:{port}/parse-resume")
    print(f"  POST http://localhost:{port}/parse-resume-url")

    app.run(host='0.0.0.0', port=port, debug=debug)