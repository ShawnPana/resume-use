"use node";

import Anthropic from "@anthropic-ai/sdk";
import PDFParser from "pdf2json";
import mammoth from "mammoth";

export interface ResumeData {
  header: {
    email: string;
    github: string;
    lastUpdated: string;
    linkedin: string;
    location: string;
    name: string;
    phone: string;
    skills: {
      languages?: string[];
      webDevelopment?: string[];
      aiML?: string[];
      cloudData?: string[];
      tools?: string[];
      [key: string]: string[] | undefined;
    };
    tagline: string;
    website: string;
  };
  education: {
    coursework: string[];
    degree: string;
    endDate: string;
    gpa: string;
    major: string;
    startDate: string;
    university: string;
  };
  experience: Array<{
    description: string;
    endDate: string;
    position: string;
    location: string;
    employmentType: string;
    startDate: string;
    title: string;
    url: string;
  }>;
  projects: Array<{
    award: string;
    date: string;
    description: string;
    endDate: string;
    event: string;
    organization: string;
    title: string;
    url: string;
  }>;
}

export class ResumeParser {
  private anthropicClient: Anthropic;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Anthropic API key is required");
    }
    this.anthropicClient = new Anthropic({ apiKey });
  }

  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfParser = new (PDFParser as any)(null, 1);

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(`PDF parsing error: ${errData.parserError}`));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          // Extract text from all pages
          let text = "";
          if (pdfData.Pages) {
            for (const page of pdfData.Pages) {
              if (page.Texts) {
                for (const textItem of page.Texts) {
                  if (textItem.R) {
                    for (const r of textItem.R) {
                      if (r.T) {
                        // Decode URI component to handle special characters
                        text += decodeURIComponent(r.T) + " ";
                      }
                    }
                  }
                }
                text += "\n";
              }
            }
          }
          resolve(text.trim());
        } catch (error) {
          reject(new Error(`Error extracting text from PDF: ${String(error)}`));
        }
      });

      pdfParser.parseBuffer(buffer);
    });
  }

  private async extractTextFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`Error extracting text from DOCX: ${String(error)}`);
    }
  }

  private async extractText(buffer: Buffer, fileType: string): Promise<string> {
    const extension = fileType.toLowerCase();

    if (extension === "pdf" || extension === ".pdf" || extension.includes("pdf")) {
      return await this.extractTextFromPDF(buffer);
    } else if (extension === "docx" || extension === ".docx" || extension === "doc" || extension === ".doc" || extension.includes("word")) {
      return await this.extractTextFromDocx(buffer);
    } else {
      throw new Error(`Unsupported file type: ${extension}. Only PDF and DOCX files are supported.`);
    }
  }


  private validateAndCleanData(data: any): ResumeData {
    // Ensure all required top-level keys exist
    if (!data.header) data.header = {};
    if (!data.education) data.education = {};
    if (!data.experience) data.experience = [];
    if (!data.projects) data.projects = [];

    // Clean header
    const headerFields = ['email', 'github', 'lastUpdated', 'linkedin', 'location',
                        'name', 'phone', 'skills', 'tagline', 'website'];
    for (const field of headerFields) {
      if (!(field in data.header)) {
        if (field === 'skills') {
          data.header.skills = {};
        } else {
          data.header[field] = "";
        }
      }
    }

    // Ensure skills is properly formatted as an object
    if (typeof data.header.skills !== 'object' || Array.isArray(data.header.skills)) {
      data.header.skills = {};
    }

    // Clean education
    const eduFields = ['coursework', 'degree', 'endDate', 'gpa', 'major', 'startDate', 'university'];
    for (const field of eduFields) {
      if (!(field in data.education)) {
        if (field === 'coursework') {
          data.education[field] = [];
        } else {
          data.education[field] = "";
        }
      }
    }

    // Ensure coursework is a list
    if (!Array.isArray(data.education.coursework)) {
      data.education.coursework = [];
    }

    // Clean experience entries
    const expFields = ['description', 'endDate', 'position', 'location', 'employmentType', 'startDate', 'title', 'url'];
    for (let i = 0; i < data.experience.length; i++) {
      for (const field of expFields) {
        if (!(field in data.experience[i])) {
          data.experience[i][field] = "";
        }
      }
    }

    // Clean project entries
    const projFields = ['award', 'date', 'description', 'endDate', 'event', 'organization', 'title', 'url'];
    for (let i = 0; i < data.projects.length; i++) {
      for (const field of projFields) {
        if (!(field in data.projects[i])) {
          data.projects[i][field] = "";
        }
      }
    }

    // Set lastUpdated to current date
    const now = new Date();
    data.header.lastUpdated = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    return data as ResumeData;
  }

  async parseWithAnthropic(resumeText: string): Promise<ResumeData> {
    const systemPrompt = `You are a resume parser that extracts information from resumes and formats it into a specific JSON structure.

IMPORTANT: Return ONLY valid JSON without any markdown code blocks or additional text.

Extract the following information from the resume and format it according to this exact structure:

{
  "header": {
    "email": "email address",
    "github": "github profile URL (full URL)",
    "lastUpdated": "",  // Leave empty
    "linkedin": "linkedin profile URL (full URL)",
    "location": "city, state or city, country",
    "name": "full name",
    "phone": "phone number",
    "skills": {
      // Intelligently categorize skills based on their type
      // Create logical groupings like "Programming Languages", "Frameworks", "Databases", etc.
      // Use appropriate category names based on the actual skills found
      "categoryName1": ["relevant skills"],
      "categoryName2": ["relevant skills"]
      // Add as many categories as needed
    },
    "tagline": "professional tagline or objective",
    "website": "personal website URL"
  },
  "education": {
    "coursework": ["list of relevant courses"],
    "degree": "degree type (e.g., Bachelor of Science (B.S.))",
    "endDate": "MM/YYYY or 'Present'",
    "gpa": "GPA value",
    "major": "field of study",
    "startDate": "MM/YYYY",
    "university": "university name"
  },
  "experience": [
    {
      "description": "brief description of role and achievements",
      "endDate": "MM/YYYY or 'Present'",
      "position": "job title",
      "location": "city, state or city, country (e.g., San Francisco, CA or London, UK)",
      "employmentType": "Full-time, Part-time, Internship, Co-op, or Volunteer (ONLY use one of these exact values)",
      "startDate": "MM/YYYY",
      "title": "company name",
      "url": "company website if mentioned"
    }
  ],
  "projects": [
    {
      "award": "any awards won",
      "date": "MM/YYYY",
      "description": "project description",
      "endDate": "MM/YYYY or 'Present' if ongoing",
      "event": "hackathon or event name if applicable",
      "organization": "organization if applicable",
      "title": "project name",
      "url": "project URL if available"
    }
  ]
}

Guidelines:
- If information is not available, use empty string "" for strings, empty array [] for arrays
- For skills, create intelligent category names based on the actual skills found (e.g., "Programming Languages", "Frontend", "Backend", "Databases", "Cloud Services", "DevOps", "Testing", etc.)
- Don't use generic names like "categoryName1" - use descriptive category names that make sense for the skills
- Group related skills together logically
- Format all dates as MM/YYYY (e.g., "09/2024")
- For links, if it does not start with "https://", add that to the beginning of the link. 
- If only date is provided, make the missing date the same as the provided date
- For current positions/projects, use "Present" as endDate
- For location field in experience:
  - Extract the city and state/country where the job was located
  - Format as "City, State" for US locations (e.g., "San Francisco, CA")
  - Format as "City, Country" for international locations (e.g., "London, UK")
  - Use "Remote" if the position is explicitly mentioned as remote
  - If no location is mentioned, use empty string ""
- For employmentType, ONLY use one of these exact values: "Full-time", "Part-time", "Internship", "Co-op", or "Volunteer"
- If the position mentions "intern" or "internship", use "Internship"
- If it mentions "co-op" or "cooperative", use "Co-op"
- If it mentions "volunteer" or "volunteering", use "Volunteer"
- If it mentions "part-time" or indicates reduced hours, use "Part-time"
- For research positions, postdoc, or any other full-time position, use "Full-time"
- Never use "Research", "Contract", "Freelance" or any other value not in the list
- Extract as much relevant information as possible from the resume
- Combine multiple bullet points into a single description field with clear, concise text
- If a position is not necessarily an employment position, for instance a school position, intelligently include it as a volunter experience if it makes sense
- Do not invent information that is not in the resume
- Make sure that every single experience and project has been extracted`;

    const userPrompt = `Parse the following resume and extract information into the JSON format:\n\n${resumeText}`;

    try {
      const response = await this.anthropicClient.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        temperature: 0,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ]
      });

      // Extract the JSON from the response
      const responseText = response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : '';

      // Try to parse the JSON
      try {
        const parsedData = JSON.parse(responseText);
        return this.validateAndCleanData(parsedData);
      } catch {
        // If direct parsing fails, try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          return this.validateAndCleanData(parsedData);
        } else {
          throw new Error("Could not extract valid JSON from API response");
        }
      }
    } catch (error) {
      throw new Error(`Error calling Anthropic API: ${String(error)}`);
    }
  }

  async parseResume(buffer: Buffer, fileType: string): Promise<ResumeData> {
    // Extract text from the file first
    const resumeText = await this.extractText(buffer, fileType);

    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error("Could not extract sufficient text from the resume file");
    }

    console.log(`Extracted ${resumeText.length} characters from resume`);
    console.log("First 500 chars:", resumeText.substring(0, 500));

    // Parse the extracted text with Anthropic API
    const parsedData = await this.parseWithAnthropic(resumeText);

    return parsedData;
  }
}