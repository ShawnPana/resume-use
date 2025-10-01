import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import React, { useState, useRef } from "react";
import { searchMajors } from "./majorsData";
import { searchDegrees } from "./degreesData";
import ResumeExport from "./ResumeExport";

// Format date input helper
function formatDateInput(value: string, prevValue: string): string {
  // If the value is empty, return empty
  if (value === '') {
    return '';
  }

  // Allow "Present" as a valid value
  if (value.toLowerCase() === 'present') {
    return 'Present';
  }

  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // If no numbers, return empty
  if (numbers.length === 0) {
    return '';
  }

  // Don't allow more than 6 digits (MMYYYY)
  if (numbers.length > 6) {
    return prevValue === 'Present' ? '' : prevValue;
  }

  // Format as MM/YYYY
  let formatted = '';
  if (numbers.length >= 2) {
    formatted = numbers.slice(0, 2);
    if (numbers.length > 2) {
      formatted += '/' + numbers.slice(2, 6);
    }
  } else {
    formatted = numbers;
  }

  return formatted;
}

// Reusable component for managing list items as cards/tags
function TagManager({
  items,
  onItemsChange,
  placeholder = "Add new item...",
  label
}: {
  items: string[];
  onItemsChange: (items: string[]) => void;
  placeholder?: string;
  label: string;
}) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onItemsChange([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      {label && <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">{label}</label>}

      {/* Display existing items as tags */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs bg-dark-grey border border-border-grey text-light-grey hover:border-primary-orange transition-colors duration-200"
            >
              {item}
              <button
                onClick={() => removeItem(index)}
                className="ml-2 text-muted hover:text-primary-orange transition-colors duration-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add new item input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 bg-near-black border border-border-grey rounded-lg text-sm placeholder-muted focus:border-primary-orange transition-all duration-200"
        />
        <button
          onClick={addItem}
          className="px-6 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200 text-sm"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// File Upload Component
function FileUploadSection() {
  const uploadAndParseResume = useAction(api.uploadResume.uploadAndParseResume);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setUploadStatus({type: 'error', message: 'Please upload a PDF or DOCX file'});
      return;
    }

    setIsUploading(true);
    setUploadStatus({type: null, message: ''});

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      // Determine file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

      // Send to Convex action for processing
      const result = await uploadAndParseResume({
        file: base64,
        fileType: fileExtension
      });

      if (result.success) {
        setUploadStatus({type: 'success', message: result.message || 'Resume uploaded and parsed successfully!'});
        // Data will update automatically via Convex real-time sync
      } else {
        setUploadStatus({type: 'error', message: result.error || 'Failed to parse resume'});
      }

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({type: 'error', message: 'Failed to upload resume. Please try again.'});
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-near-black border border-border-grey rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold text-off-white mb-4">Import Resume</h2>
      <p className="text-sm text-muted mb-4">Upload a PDF or DOCX file to automatically import your resume data</p>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => void handleFileUpload(e)}
            disabled={isUploading}
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className={`flex items-center justify-center px-6 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
              isUploading
                ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
                : 'border-border-grey hover:border-primary-orange hover:bg-dark-grey'
            }`}
          >
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-light-grey">
                {isUploading ? 'Processing...' : 'Click to upload resume (PDF or DOCX)'}
              </p>
            </div>
          </label>
        </div>

        {uploadStatus.type && (
          <div className={`p-3 rounded-lg text-sm ${
            uploadStatus.type === 'success'
              ? 'bg-green-900/20 border border-green-700 text-green-400'
              : 'bg-red-900/20 border border-red-700 text-red-400'
          }`}>
            <pre className="whitespace-pre-wrap font-sans">{uploadStatus.message}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const resumeData = useQuery(api.resumeFunctions.getFullResume);
  const [activeSection, setActiveSection] = useState<"about" | "experience" | "projects">("about");
  const [showUpload, setShowUpload] = useState(false);

  // State for tracking selected items for export (default: all selected)
  const [selectedExperiences, setSelectedExperiences] = useState<Set<string>>(
    new Set(resumeData?.experience?.map((exp: any) => exp._id) || [])
  );
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set(resumeData?.projects?.map((proj: any) => proj._id) || [])
  );

  // Update selected items when data changes
  React.useEffect(() => {
    if (resumeData?.experience) {
      setSelectedExperiences(new Set(resumeData.experience.map((exp: any) => exp._id)));
    }
  }, [resumeData?.experience]);

  React.useEffect(() => {
    if (resumeData?.projects) {
      setSelectedProjects(new Set(resumeData.projects.map((proj: any) => proj._id)));
    }
  }, [resumeData?.projects]);

  // Toggle selection for experiences
  const toggleExperienceSelection = (id: string) => {
    setSelectedExperiences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle selection for projects
  const toggleProjectSelection = (id: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Select/deselect all experiences
  const toggleAllExperiences = () => {
    if (selectedExperiences.size === resumeData?.experience?.length) {
      setSelectedExperiences(new Set());
    } else {
      setSelectedExperiences(new Set(resumeData?.experience?.map((exp: any) => exp._id) || []));
    }
  };

  // Select/deselect all projects
  const toggleAllProjects = () => {
    if (selectedProjects.size === resumeData?.projects?.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(resumeData?.projects?.map((proj: any) => proj._id) || []));
    }
  };

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-primary-black flex items-center justify-center">
        <div className="text-xl text-light-grey animate-pulse">Loading resume data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-black">
      <header className="sticky top-0 z-50 bg-near-black/95 backdrop-blur-md border-b border-border-grey">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/browser-use-logo.png"
                alt="ResumeUse Logo"
                className="w-8 h-8"
              />
              <h1 className="text-xl font-semibold text-off-white tracking-tight">ResumeUse</h1>
            </div>
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveSection("about")}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeSection === "about"
                    ? "bg-primary-orange text-primary-black"
                    : "text-light-grey hover:text-off-white hover:bg-dark-grey"
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveSection("experience")}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeSection === "experience"
                    ? "bg-primary-orange text-primary-black"
                    : "text-light-grey hover:text-off-white hover:bg-dark-grey"
                }`}
              >
                Experience
                <span className="ml-2 text-xs opacity-60">({resumeData.experience?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveSection("projects")}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeSection === "projects"
                    ? "bg-primary-orange text-primary-black"
                    : "text-light-grey hover:text-off-white hover:bg-dark-grey"
                }`}
              >
                Projects
                <span className="ml-2 text-xs opacity-60">({resumeData.projects?.length || 0})</span>
              </button>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ml-2 ${
                  showUpload
                    ? "bg-green-600 text-white"
                    : "border border-green-600 text-green-400 hover:bg-green-600/20"
                }`}
              >
                {showUpload ? "Hide Import" : "Import Resume"}
              </button>
              <ResumeExport
                selectedExperiences={selectedExperiences}
                selectedProjects={selectedProjects}
              />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 animate-fade-in w-full">
        {showUpload && <FileUploadSection />}
        {activeSection === "about" && <AboutSection data={resumeData} />}
        {activeSection === "experience" && (
          <ExperienceSection
            data={resumeData}
            selectedExperiences={selectedExperiences}
            toggleExperienceSelection={toggleExperienceSelection}
            toggleAllExperiences={toggleAllExperiences}
          />
        )}
        {activeSection === "projects" && (
          <ProjectsSection
            data={resumeData}
            selectedProjects={selectedProjects}
            toggleProjectSelection={toggleProjectSelection}
            toggleAllProjects={toggleAllProjects}
          />
        )}
      </main>
    </div>
  );
}

function AboutSection({ data }: { data: any }) {
  const updateHeader = useMutation(api.resumeFunctions.upsertHeader);
  const updateEducation = useMutation(api.resumeFunctions.upsertEducation);

  // Convert existing skills to array format for easier manipulation
  const convertSkillsToArray = (skills: Record<string, string[]>) => {
    return Object.entries(skills || {}).map(([category, items]) => ({
      category,
      items
    }));
  };

  const [headerForm, setHeaderForm] = useState({
    name: data.header?.name || "",
    tagline: data.header?.tagline || "",
    email: data.header?.email || "",
    website: data.header?.website || "",
    linkedin: data.header?.linkedin || "",
    github: data.header?.github || "",
    lastUpdated: data.header?.lastUpdated || "",
  });

  const [skillCategories, setSkillCategories] = useState(
    convertSkillsToArray(data.header?.skills || {})
  );
  const [selectedSkillIndex, setSelectedSkillIndex] = useState<{category: number; skill: number} | null>(null);
  const [focusedSkillBox, setFocusedSkillBox] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const [educationForm, setEducationForm] = useState({
    university: data.education?.university || "",
    degree: data.education?.degree || "",
    major: data.education?.major || "",
    startDate: data.education?.startDate || "",
    endDate: data.education?.endDate || "",
    gpa: data.education?.gpa || "",
    coursework: data.education?.coursework || [],
  });

  const [headerSaveSuccess, setHeaderSaveSuccess] = useState(false);
  const [educationSaveSuccess, setEducationSaveSuccess] = useState(false);
  const [universitySearchResults, setUniversitySearchResults] = useState<Array<{name: string; country: string}>>([]);
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [searchingUniversities, setSearchingUniversities] = useState(false);
  const [selectedUniversityIndex, setSelectedUniversityIndex] = useState(-1);
  const [majorSearchResults, setMajorSearchResults] = useState<string[]>([]);
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [searchingMajors, setSearchingMajors] = useState(false);
  const [selectedMajorIndex, setSelectedMajorIndex] = useState(-1);
  const [degreeSearchResults, setDegreeSearchResults] = useState<Array<{abbreviation: string; fullName: string}>>([]);
  const [showDegreeDropdown, setShowDegreeDropdown] = useState(false);
  const [selectedDegreeIndex, setSelectedDegreeIndex] = useState(-1);

  // Debounce timer ref
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const majorSearchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const degreeSearchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Search universities function
  const searchUniversities = async (query: string) => {
    if (query.length < 2) {
      setUniversitySearchResults([]);
      setShowUniversityDropdown(false);
      return;
    }

    setSearchingUniversities(true);

    try {
      const url = `http://universities.hipolabs.com/search?name=${encodeURIComponent(query)}`;
      console.log('Fetching universities from:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('API Response:', data);

      if (Array.isArray(data)) {
        // Take top 5 results and format them
        const results = data.slice(0, 5).map((uni: any) => ({
          name: uni.name,
          country: uni.country
        }));

        console.log('Formatted results:', results);
        setUniversitySearchResults(results);
        setShowUniversityDropdown(results.length > 0);
      } else {
        console.log('Unexpected response format:', data);
        setUniversitySearchResults([]);
        setShowUniversityDropdown(false);
      }
    } catch (error) {
      console.error('Error searching universities:', error);
      setUniversitySearchResults([]);
      setShowUniversityDropdown(false);
    } finally {
      setSearchingUniversities(false);
    }
  };

  // Handle university input change with debouncing
  const handleUniversityChange = (value: string) => {
    setEducationForm({ ...educationForm, university: value });
    setSelectedUniversityIndex(-1);

    // Clear existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Set new timer for debounced search
    searchTimerRef.current = setTimeout(() => {
      void searchUniversities(value);
    }, 300);
  };

  // Handle major input change with search
  const handleMajorChange = (value: string) => {
    setEducationForm({ ...educationForm, major: value });
    setSelectedMajorIndex(-1);

    // Clear previous timer
    if (majorSearchTimerRef.current) {
      clearTimeout(majorSearchTimerRef.current);
    }

    // Set new timer for debounced search
    majorSearchTimerRef.current = setTimeout(() => {
      if (value.length < 2) {
        setMajorSearchResults([]);
        setShowMajorDropdown(false);
        return;
      }

      setSearchingMajors(true);
      const results = searchMajors(value);
      const majorNames = results.map(m => m.name);

      // Add custom major option if no exact match found
      if (majorNames.length === 0 || !majorNames.some(m => m.toLowerCase() === value.toLowerCase())) {
        setMajorSearchResults([...majorNames, `Use "${value}" as custom major`]);
      } else {
        setMajorSearchResults(majorNames);
      }

      setShowMajorDropdown(true);
      setSearchingMajors(false);
    }, 300);
  };

  // Handle degree input change with search
  const handleDegreeChange = (value: string) => {
    setEducationForm({ ...educationForm, degree: value });
    setSelectedDegreeIndex(-1);

    // Clear previous timer
    if (degreeSearchTimerRef.current) {
      clearTimeout(degreeSearchTimerRef.current);
    }

    // Set new timer for search
    degreeSearchTimerRef.current = setTimeout(() => {
      if (value.length < 1) {
        setDegreeSearchResults([]);
        setShowDegreeDropdown(false);
        return;
      }

      const results = searchDegrees(value);
      const degreeOptions = results.map(d => ({
        abbreviation: d.abbreviation,
        fullName: d.fullName
      }));

      // Add custom degree option if no exact match
      if (degreeOptions.length === 0 || !degreeOptions.some(d =>
        d.abbreviation.toLowerCase() === value.toLowerCase() ||
        d.fullName.toLowerCase() === value.toLowerCase()
      )) {
        degreeOptions.push({
          abbreviation: value,
          fullName: `Use "${value}" as custom degree`
        });
      }

      setDegreeSearchResults(degreeOptions);
      setShowDegreeDropdown(true);
    }, 300);
  };


  const handleHeaderSave = async () => {
    // First, collect any unsaved text from input fields
    const finalSkillCategories = [...skillCategories];

    // Check each skill input field for unsaved text
    document.querySelectorAll('input[placeholder="Type skills separated by commas"], input[placeholder="Add more skills..."]').forEach((input, index) => {
      const inputElement = input as HTMLInputElement;
      const value = inputElement.value.trim();
      if (value && index < finalSkillCategories.length) {
        // Handle multiple comma-separated skills
        const skills = value.split(',').map(s => s.trim()).filter(s => s);
        const newSkills = skills.filter(skill => !finalSkillCategories[index].items.includes(skill));
        if (newSkills.length > 0) {
          finalSkillCategories[index].items = [...finalSkillCategories[index].items, ...newSkills];
        }
        // Clear the input after saving
        inputElement.value = '';
      }
    });

    // Convert skills array back to object format
    const skillsObject: Record<string, string[]> = {};
    finalSkillCategories.forEach(({ category, items }) => {
      if (category.trim()) {
        skillsObject[category] = items;
      }
    });

    await updateHeader({
      ...headerForm,
      skills: skillsObject
    });

    // Update state with the final categories (including the added items)
    setSkillCategories(finalSkillCategories);

    setHeaderSaveSuccess(true);
    setTimeout(() => setHeaderSaveSuccess(false), 3000); // Hide after 3 seconds
  };

  const addSkillCategory = () => {
    setSkillCategories([...skillCategories, { category: "", items: [] }]);
  };

  const removeSkillCategory = (index: number) => {
    setSkillCategories(skillCategories.filter((_, i) => i !== index));
  };

  const updateSkillCategory = (index: number, field: 'category' | 'items', value: string | string[]) => {
    const updated = [...skillCategories];
    if (field === 'category') {
      updated[index].category = value as string;
    } else {
      updated[index].items = value as string[];
    }
    setSkillCategories(updated);
  };

  const handleEducationSave = async () => {
    await updateEducation(educationForm);
    setEducationSaveSuccess(true);
    setTimeout(() => setEducationSaveSuccess(false), 3000); // Hide after 3 seconds
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-near-black border border-border-grey rounded-xl p-6 animate-slide-up">
        <h2 className="text-lg font-semibold mb-6 text-off-white">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Name</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.header?.name || "Not set"}
            </div>
            <input
              type="text"
              value={headerForm.name}
              onChange={(e) => setHeaderForm({ ...headerForm, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Email</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.header?.email || "Not set"}
            </div>
            <input
              type="email"
              value={headerForm.email}
              onChange={(e) => setHeaderForm({ ...headerForm, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Tagline</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.header?.tagline || "Not set"}
            </div>
            <input
              type="text"
              value={headerForm.tagline}
              onChange={(e) => setHeaderForm({ ...headerForm, tagline: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Website</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.header?.website || "Not set"}
            </div>
            <input
              type="url"
              value={headerForm.website}
              onChange={(e) => setHeaderForm({ ...headerForm, website: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">LinkedIn</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.header?.linkedin || "Not set"}
            </div>
            <input
              type="url"
              value={headerForm.linkedin}
              onChange={(e) => setHeaderForm({ ...headerForm, linkedin: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">GitHub</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.header?.github || "Not set"}
            </div>
            <input
              type="url"
              value={headerForm.github}
              onChange={(e) => setHeaderForm({ ...headerForm, github: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

        </div>

        {/* Skills Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-off-white">Skills</h3>
              <div className="relative flex items-center">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-off-white hover:text-primary-orange transition-all duration-200 flex items-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v.01M12 12v4" strokeLinecap="round" />
                  </svg>
                </button>
                {showTooltip && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-dark-grey text-off-white text-xs px-3 py-2 rounded-lg border border-border-grey shadow-lg z-10">
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-dark-grey border-r border-b border-border-grey"></div>
                    The inspiration for this section came from Quizlet!
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={addSkillCategory}
              className="px-4 py-2 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200 text-sm flex items-center gap-2 focus:outline-none"
            >
              <span className="text-lg leading-none">+</span>
              Add Category
            </button>
          </div>

          {/* Current skills display */}
          {data.header?.skills && Object.keys(data.header.skills).length > 0 && (
            <div className="mb-4 p-3 bg-dark-grey/50 rounded-lg">
              <div className="text-xs text-muted mb-2">Current Skills:</div>
              {Object.entries(data.header.skills).map(([cat, skills]: [string, any]) => (
                <div key={cat} className="text-xs text-light-grey">
                  <span className="font-medium">{cat}:</span> {skills.join(", ")}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {skillCategories.map((skillCat, index) => (
              <div key={index} className="bg-near-black border border-border-grey rounded-xl p-5 relative">
                {/* Card number in top left */}
                <div className="absolute top-3 left-4 text-lg font-semibold text-light-grey">
                  {index + 1}
                </div>

                {/* Delete button in top right */}
                <button
                  onClick={() => removeSkillCategory(index)}
                  className="absolute top-3 right-3 p-1 text-light-grey hover:text-off-white hover:bg-dark-grey rounded transition-all duration-200"
                  title="Remove category"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Category name and skills in card layout */}
                <div className="grid grid-cols-2 gap-5 mt-6">
                  <div>
                    <input
                      type="text"
                      value={skillCat.category}
                      onChange={(e) => updateSkillCategory(index, 'category', e.target.value)}
                      placeholder="Enter category name"
                      className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white text-sm placeholder-muted focus:border-primary-orange focus:outline-none transition-all duration-200"
                    />
                    <label className="block text-xs text-muted mt-1.5 uppercase tracking-wider">Category</label>
                  </div>

                  <div>
                    <div
                      className="px-3 py-2.5 bg-primary-black border border-border-grey rounded-lg cursor-text focus:border-primary-orange focus:outline-none transition-all duration-200 min-h-[42px] max-h-[120px] overflow-y-auto"
                      tabIndex={0}
                      onFocus={() => setFocusedSkillBox(index)}
                      onBlur={() => setFocusedSkillBox(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Delete' || e.key === 'Backspace') {
                          e.preventDefault();
                          if (selectedSkillIndex && selectedSkillIndex.category === index) {
                            // Delete the selected skill
                            const newItems = skillCat.items.filter((_, i) => i !== selectedSkillIndex.skill);
                            updateSkillCategory(index, 'items', newItems);
                            setSelectedSkillIndex(null);
                          } else if (skillCat.items.length > 0) {
                            // Select the last skill
                            setSelectedSkillIndex({ category: index, skill: skillCat.items.length - 1 });
                          }
                        }
                      }}
                    >
                      {skillCat.items.length === 0 ? (
                        <span className="text-muted text-sm">No skills added yet</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {skillCat.items.map((item, itemIndex) => (
                            <span
                              key={itemIndex}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs transition-all duration-200 ${
                                selectedSkillIndex?.category === index && selectedSkillIndex?.skill === itemIndex
                                  ? 'bg-primary-orange text-primary-black'
                                  : 'bg-dark-grey text-off-white'
                              }`}
                            >
                              {item}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newItems = skillCat.items.filter((_, i) => i !== itemIndex);
                                  updateSkillCategory(index, 'items', newItems);
                                  if (selectedSkillIndex?.category === index && selectedSkillIndex?.skill === itemIndex) {
                                    setSelectedSkillIndex(null);
                                  }
                                }}
                                className="ml-1 hover:opacity-70 text-xs"
                              >
                                ×
                                
                              </button>
                            </span>
                          ))}
                          {/* Blinking cursor when focused */}
                          {focusedSkillBox === index && (
                            <span className="inline-block w-0.5 h-4 bg-off-white animate-pulse"></span>
                          )}
                        </div>
                      )}
                    </div>
                    <label className="block text-xs text-muted mt-1.5 uppercase tracking-wider">Skills</label>
                  </div>
                </div>

                {/* Input field at bottom of card */}
                <div className="mt-3 grid grid-cols-2 gap-5">
                  <div></div>
                  <div>
                    <input
                      id={`skill-input-${index}`}
                      type="text"
                      placeholder="Add skills (comma/enter separated)"
                      className="w-full px-3 py-2 bg-primary-black border border-border-grey rounded-lg text-off-white text-sm placeholder-muted focus:border-primary-orange focus:outline-none transition-all duration-200"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const value = input.value.trim();
                          if (value) {
                            const skills = value.split(',').map(s => s.trim()).filter(s => s && !skillCat.items.includes(s));
                            if (skills.length > 0) {
                              updateSkillCategory(index, 'items', [...skillCat.items, ...skills]);
                              input.value = '';
                              setSelectedSkillIndex(null);
                            }
                          }
                        }
                      }}
                      onChange={(e) => {
                        const input = e.target as HTMLInputElement;
                        if (input.value.includes(',')) {
                          const values = input.value.split(',');
                          const completedSkills = values.slice(0, -1).map(s => s.trim()).filter(s => s && !skillCat.items.includes(s));
                          if (completedSkills.length > 0) {
                            updateSkillCategory(index, 'items', [...skillCat.items, ...completedSkills]);
                          }
                          input.value = values[values.length - 1].trim();
                          setSelectedSkillIndex(null);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {skillCategories.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-border-grey rounded-lg">
                <p className="text-muted mb-3">No skill categories added yet</p>
                <button
                  onClick={addSkillCategory}
                  className="px-4 py-2 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200 text-sm focus:outline-none"
                >
                  Add Your First Category
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => void handleHeaderSave()}
            className="px-6 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200"
          >
            Save Header Information
          </button>
          {headerSaveSuccess && (
            <span className="text-green-500 text-sm font-medium animate-fade-in">
              ✓ Saved successfully
            </span>
          )}
        </div>
      </div>

      {/* Education Section */}
      <div className="bg-near-black border border-border-grey rounded-xl p-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
        <h2 className="text-lg font-semibold mb-6 text-off-white">Education</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">University</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.education?.university || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.university}
              onChange={(e) => handleUniversityChange(e.target.value)}
              onKeyDown={(e) => {
                if (showUniversityDropdown && universitySearchResults.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedUniversityIndex(prev =>
                      prev < universitySearchResults.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedUniversityIndex(prev => prev > 0 ? prev - 1 : -1);
                  } else if (e.key === 'Enter' && selectedUniversityIndex >= 0) {
                    e.preventDefault();
                    const selected = universitySearchResults[selectedUniversityIndex];
                    setEducationForm({ ...educationForm, university: selected.name });
                    setShowUniversityDropdown(false);
                    setSelectedUniversityIndex(-1);
                  } else if (e.key === 'Escape') {
                    setShowUniversityDropdown(false);
                    setSelectedUniversityIndex(-1);
                  }
                }
              }}
              onFocus={() => {
                if (educationForm.university.length >= 2) {
                  void searchUniversities(educationForm.university);
                }
              }}
              onBlur={() => {
                // Delay hiding to allow click on dropdown items
                setTimeout(() => {
                  setShowUniversityDropdown(false);
                  setSelectedUniversityIndex(-1);
                }, 200);
              }}
              placeholder="Start typing to search universities..."
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
            {/* University search dropdown */}
            {showUniversityDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-near-black border border-border-grey rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchingUniversities ? (
                  <div className="px-4 py-3 text-sm text-muted">Searching...</div>
                ) : universitySearchResults.length > 0 ? (
                  universitySearchResults.map((uni, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setEducationForm({ ...educationForm, university: uni.name });
                        setShowUniversityDropdown(false);
                        setSelectedUniversityIndex(-1);
                      }}
                      className={`w-full px-4 py-2.5 text-left transition-colors duration-150 flex justify-between items-center group ${
                        selectedUniversityIndex === index ? 'bg-dark-grey' : 'hover:bg-dark-grey'
                      }`}
                      onMouseEnter={() => setSelectedUniversityIndex(index)}
                    >
                      <span className="text-sm text-off-white">{uni.name}</span>
                      <span className="text-xs text-muted group-hover:text-light-grey">{uni.country}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-muted">No universities found</div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Degree</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.education?.degree || "Not set"}
            </div>
            <div className="relative">
              <input
                type="text"
                value={educationForm.degree}
                onChange={(e) => handleDegreeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (showDegreeDropdown && degreeSearchResults.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedDegreeIndex(prev =>
                        prev < degreeSearchResults.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedDegreeIndex(prev => prev > 0 ? prev - 1 : -1);
                    } else if (e.key === 'Enter' && selectedDegreeIndex >= 0) {
                      e.preventDefault();
                      const selected = degreeSearchResults[selectedDegreeIndex];
                      const isCustom = selected.fullName.startsWith('Use "');
                      const degreeValue = isCustom ? educationForm.degree : `${selected.fullName} (${selected.abbreviation})`;
                      setEducationForm({ ...educationForm, degree: degreeValue });
                      setShowDegreeDropdown(false);
                      setSelectedDegreeIndex(-1);
                    } else if (e.key === 'Escape') {
                      setShowDegreeDropdown(false);
                      setSelectedDegreeIndex(-1);
                    }
                  }
                }}
                onFocus={() => {
                  if (educationForm.degree.length >= 1) {
                    handleDegreeChange(educationForm.degree);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setShowDegreeDropdown(false);
                    setSelectedDegreeIndex(-1);
                  }, 200);
                }}
                placeholder="e.g., Bachelor of Science (B.S.), Master of Arts (M.A.)..."
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
              />
              {/* Degree search dropdown */}
              {showDegreeDropdown && degreeSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-near-black border border-border-grey rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {degreeSearchResults.map((degree, index) => {
                    const isCustom = degree.fullName.startsWith('Use "');
                    return (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const degreeValue = isCustom ? educationForm.degree : `${degree.fullName} (${degree.abbreviation})`;
                          setEducationForm({ ...educationForm, degree: degreeValue });
                          setShowDegreeDropdown(false);
                          setSelectedDegreeIndex(-1);
                        }}
                        className={`w-full px-4 py-3 text-left transition-colors duration-200 text-sm border-b border-border-grey last:border-0 ${
                          selectedDegreeIndex === index ? 'bg-dark-grey' : 'hover:bg-dark-grey'
                        }`}
                        onMouseEnter={() => setSelectedDegreeIndex(index)}
                      >
                        <div className="text-off-white">
                          {isCustom ? (
                            <span className="italic text-muted">{degree.fullName}</span>
                          ) : (
                            <>
                              <span className="font-medium">{degree.abbreviation}</span>
                              <span className="text-muted ml-2">- {degree.fullName}</span>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Major</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.education?.major || "Not set"}
            </div>
            <div className="relative">
              <input
                type="text"
                value={educationForm.major}
                onChange={(e) => handleMajorChange(e.target.value)}
                onKeyDown={(e) => {
                  if (showMajorDropdown && majorSearchResults.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedMajorIndex(prev =>
                        prev < majorSearchResults.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedMajorIndex(prev => prev > 0 ? prev - 1 : -1);
                    } else if (e.key === 'Enter' && selectedMajorIndex >= 0) {
                      e.preventDefault();
                      const selected = majorSearchResults[selectedMajorIndex];
                      const isCustom = selected.startsWith('Use "');
                      const majorValue = isCustom ? educationForm.major : selected;
                      setEducationForm({ ...educationForm, major: majorValue });
                      setShowMajorDropdown(false);
                      setSelectedMajorIndex(-1);
                    } else if (e.key === 'Escape') {
                      setShowMajorDropdown(false);
                      setSelectedMajorIndex(-1);
                    }
                  }
                }}
                onFocus={() => {
                  if (educationForm.major.length >= 2) {
                    handleMajorChange(educationForm.major);
                  }
                }}
                onBlur={() => {
                  // Delay hiding to allow click on dropdown items
                  setTimeout(() => {
                    setShowMajorDropdown(false);
                    setSelectedMajorIndex(-1);
                  }, 200);
                }}
                placeholder="Start typing to search majors or enter custom..."
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
              />
              {/* Major search dropdown */}
              {showMajorDropdown && majorSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-near-black border border-border-grey rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchingMajors ? (
                    <div className="px-4 py-3 text-muted text-sm">Searching...</div>
                  ) : (
                    majorSearchResults.map((major, index) => {
                      const isCustom = major.startsWith('Use "');
                      return (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const majorValue = isCustom ? educationForm.major : major;
                            setEducationForm({ ...educationForm, major: majorValue });
                            setShowMajorDropdown(false);
                            setSelectedMajorIndex(-1);
                          }}
                          className={`w-full px-4 py-3 text-left transition-colors duration-200 text-sm border-b border-border-grey last:border-0 ${
                            selectedMajorIndex === index ? 'bg-dark-grey' : 'hover:bg-dark-grey'
                          }`}
                          onMouseEnter={() => setSelectedMajorIndex(index)}
                        >
                          <div className="text-off-white">
                            {isCustom ? (
                              <span className="italic text-muted">{major}</span>
                            ) : (
                              major
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Start Date</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.education?.startDate || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.startDate}
              onChange={(e) => {
                const formatted = formatDateInput(e.target.value, educationForm.startDate);
                setEducationForm({ ...educationForm, startDate: formatted });
              }}
              placeholder="MM/YYYY"
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">End Date</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.education?.endDate || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.endDate}
              onChange={(e) => {
                const value = e.target.value;
                if (value.toLowerCase() === 'present') {
                  setEducationForm({ ...educationForm, endDate: 'Present' });
                } else {
                  const formatted = formatDateInput(value, educationForm.endDate || '');
                  setEducationForm({ ...educationForm, endDate: formatted });
                }
              }}
              placeholder="MM/YYYY"
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">GPA</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.education?.gpa || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.gpa}
              onChange={(e) => setEducationForm({ ...educationForm, gpa: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

          <div className="md:col-span-2">
            <div className="bg-primary-black border border-border-grey rounded-lg p-5">
              <div className="text-xs text-muted mb-3">
                Current: {(data.education?.coursework || []).join(", ") || "None"}
              </div>
              <TagManager
                label="Coursework"
                items={educationForm.coursework}
                onItemsChange={(courses) => {
                  setEducationForm({ ...educationForm, coursework: courses });
                }}
                placeholder="Add course name..."
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => void handleEducationSave()}
            className="px-6 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200"
          >
            Save Education Information
          </button>
          {educationSaveSuccess && (
            <span className="text-green-500 text-sm font-medium animate-fade-in">
              ✓ Saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ExperienceSection({
  data,
  selectedExperiences,
  toggleExperienceSelection,
  toggleAllExperiences
}: {
  data: any;
  selectedExperiences: Set<string>;
  toggleExperienceSelection: (id: string) => void;
  toggleAllExperiences: () => void;
}) {
  const addExperience = useMutation(api.resumeFunctions.addExperience);
  const updateExperience = useMutation(api.resumeFunctions.updateExperience);
  const deleteExperience = useMutation(api.resumeFunctions.deleteExperience);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCurrentRole, setIsCurrentRole] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showEmploymentDropdown, setShowEmploymentDropdown] = useState(false);
  const [selectedEmploymentIndex, setSelectedEmploymentIndex] = useState(-1);
  const [newExperience, setNewExperience] = useState({
    title: "",
    position: "",
    location: "",
    employmentType: "",
    startDate: "",
    endDate: "",
    url: "",
    description: "",
  });

  const employmentTypes = [
    "Full-time",
    "Part-time",
    "Internship",
    "Co-op",
    "Volunteer"
  ];

  const handleAdd = async () => {
    if (!newExperience.title || !newExperience.position || !newExperience.employmentType || !newExperience.startDate || !newExperience.endDate) {
      alert("Please fill in required fields (company, position, employment type, start date, end date)");
      return;
    }

    try {
      // Save to Convex first
      const experienceId = await addExperience(newExperience);

      // Show success message
      alert("Experience saved to Convex!");

      // Ask user about both platforms first
      const addToLinkedIn = confirm("Would you like to add this experience to LinkedIn?");
      const addToSimplify = confirm("Would you like to add this experience to Simplify?");

      // Process both API calls in parallel
      const promises = [];

      if (addToLinkedIn) {
        promises.push(
          fetch('http://127.0.0.1:8000/linkedin/add-experience', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              experience_id: experienceId,
              action: 'add'
            })
          })
          .then(async (response) => {
            if (response.ok) {
              await response.json();
              return { platform: 'LinkedIn', success: true };
            } else {
              const error = await response.json();
              return { platform: 'LinkedIn', success: false, error: error.detail };
            }
          })
          .catch((error) => {
            console.error("Error adding to LinkedIn:", error);
            return { platform: 'LinkedIn', success: false, error: 'Backend service not running' };
          })
        );
      }

      if (addToSimplify) {
        promises.push(
          fetch('http://127.0.0.1:8000/simplify/add-experience', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              experience_id: experienceId,
              action: 'add'
            })
          })
          .then(async (response) => {
            if (response.ok) {
              await response.json();
              return { platform: 'Simplify', success: true };
            } else {
              const error = await response.json();
              return { platform: 'Simplify', success: false, error: error.detail };
            }
          })
          .catch((error) => {
            console.error("Error adding to Simplify:", error);
            return { platform: 'Simplify', success: false, error: 'Backend service not running' };
          })
        );
      }

      // Wait for all promises to complete
      if (promises.length > 0) {
        const results = await Promise.all(promises);

        // Show results
        const successfulPlatforms = results.filter(r => r.success).map(r => r.platform);
        const failedPlatforms = results.filter(r => !r.success);

        if (successfulPlatforms.length > 0) {
          alert(`Experience successfully added to: ${successfulPlatforms.join(', ')}`);
        }

        if (failedPlatforms.length > 0) {
          const errorMessages = failedPlatforms.map(p => `${p.platform}: ${p.error}`).join('\n');
          alert(`Failed to add experience to:\n${errorMessages}`);
        }
      }

      // Reset form
      setNewExperience({
        title: "",
        position: "",
        location: "",
        employmentType: "",
        startDate: "",
        endDate: "",
        url: "",
        description: "",
      });
      setIsCurrentRole(false);
      setShowAddForm(false);

    } catch (error) {
      console.error("Error adding experience:", error);
      alert("Failed to add experience. Please try again.");
    }
  };

  const handleUpdate = async () => {
    if (!newExperience.title || !newExperience.position || !newExperience.employmentType || !newExperience.startDate || !newExperience.endDate) {
      alert("Please fill in required fields (company, position, employment type, start date, end date)");
      return;
    }

    if (editingId) {
      await updateExperience({
        id: editingId as any,
        ...newExperience,
      });

      // Show success message
      alert("Experience updated in Convex!");

      // Ask user about both platforms first
      const updateOnLinkedIn = confirm("Would you like to update this experience on LinkedIn?");
      const updateOnSimplify = confirm("Would you like to update this experience on Simplify?");

      // Process both API calls in parallel
      const promises = [];

      if (updateOnLinkedIn) {
        promises.push(
          fetch('http://127.0.0.1:8000/linkedin/add-experience', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              experience_id: editingId,
              action: 'edit'
            })
          })
          .then(async (response) => {
            if (response.ok) {
              await response.json();
              return { platform: 'LinkedIn', success: true };
            } else {
              const error = await response.json();
              return { platform: 'LinkedIn', success: false, error: error.detail };
            }
          })
          .catch((error) => {
            console.error("Error updating LinkedIn:", error);
            return { platform: 'LinkedIn', success: false, error: 'Backend service not running' };
          })
        );
      }

      if (updateOnSimplify) {
        promises.push(
          fetch('http://127.0.0.1:8000/simplify/add-experience', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              experience_id: editingId,
              action: 'edit'
            })
          })
          .then(async (response) => {
            if (response.ok) {
              await response.json();
              return { platform: 'Simplify', success: true };
            } else {
              const error = await response.json();
              return { platform: 'Simplify', success: false, error: error.detail };
            }
          })
          .catch((error) => {
            console.error("Error updating Simplify:", error);
            return { platform: 'Simplify', success: false, error: 'Backend service not running' };
          })
        );
      }

      // Wait for all promises to complete
      if (promises.length > 0) {
        const results = await Promise.all(promises);

        // Show results
        const successfulPlatforms = results.filter(r => r.success).map(r => r.platform);
        const failedPlatforms = results.filter(r => !r.success);

        if (successfulPlatforms.length > 0) {
          alert(`Experience successfully updated on: ${successfulPlatforms.join(', ')}`);
        }

        if (failedPlatforms.length > 0) {
          const errorMessages = failedPlatforms.map(p => `${p.platform}: ${p.error}`).join('\n');
          alert(`Failed to update experience on:\n${errorMessages}`);
        }
      }

      setEditingId(null);
      setNewExperience({
        title: "",
        position: "",
        location: "",
        employmentType: "",
        startDate: "",
        endDate: "",
        url: "",
        description: "",
      });
      setIsCurrentRole(false);
      setShowAddForm(false);
    }
  };

  const handleEdit = (exp: any) => {
    setEditingId(exp._id);
    setIsCurrentRole(exp.endDate === 'Present');
    setShowEmploymentDropdown(false);
    setSelectedEmploymentIndex(-1);
    setNewExperience({
      title: exp.title,
      position: exp.position || "",
      location: exp.location || "",
      employmentType: exp.employmentType || "",
      startDate: exp.startDate,
      endDate: exp.endDate,
      url: exp.url || "",
      description: exp.description || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteExperience({ id: id as any });
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-off-white">Experience</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200 text-sm"
        >
          {showAddForm ? "Cancel" : "+ Add Experience"}
        </button>
      </div>

      {showAddForm && !editingId && (
        <div className="bg-near-black border-2 border-primary-orange rounded-xl p-6 animate-scale">
          <h3 className="text-lg font-semibold mb-5 text-off-white">Add New Experience</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Company/Organization *</label>
              <input
                type="text"
                value={newExperience.title}
                onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                placeholder="e.g., Google"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Position *</label>
              <input
                type="text"
                value={newExperience.position}
                onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Location</label>
              <input
                type="text"
                value={newExperience.location}
                onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Employment Type *</label>
              <input
                type="text"
                value={newExperience.employmentType}
                onChange={(e) => {
                  setNewExperience({ ...newExperience, employmentType: e.target.value });
                  setShowEmploymentDropdown(true);
                }}
                onKeyDown={(e) => {
                  if (showEmploymentDropdown) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedEmploymentIndex(prev => prev < employmentTypes.length - 1 ? prev + 1 : prev);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedEmploymentIndex(prev => prev > 0 ? prev - 1 : -1);
                    } else if (e.key === 'Enter' && selectedEmploymentIndex >= 0) {
                      e.preventDefault();
                      setNewExperience({ ...newExperience, employmentType: employmentTypes[selectedEmploymentIndex] });
                      setShowEmploymentDropdown(false);
                      setSelectedEmploymentIndex(-1);
                    } else if (e.key === 'Escape') {
                      setShowEmploymentDropdown(false);
                      setSelectedEmploymentIndex(-1);
                    }
                  }
                }}
                onFocus={() => setShowEmploymentDropdown(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowEmploymentDropdown(false);
                    setSelectedEmploymentIndex(-1);
                  }, 200);
                }}
                placeholder="e.g., Full-time, Internship, Part-time..."
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
              />
              {showEmploymentDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-near-black border border-border-grey rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {employmentTypes.filter(type =>
                    type.toLowerCase().includes(newExperience.employmentType.toLowerCase()) || !newExperience.employmentType
                  ).slice(0, 5).map((type, index) => (
                    <button
                      key={type}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setNewExperience({ ...newExperience, employmentType: type });
                        setShowEmploymentDropdown(false);
                        setSelectedEmploymentIndex(-1);
                      }}
                      className={`w-full px-4 py-3 text-left transition-colors duration-200 text-sm border-b border-border-grey last:border-0 ${
                        selectedEmploymentIndex === index ? 'bg-dark-grey text-off-white' : 'hover:bg-dark-grey text-light-grey hover:text-off-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Start Date *</label>
                <input
                  type="text"
                  value={newExperience.startDate}
                  onChange={(e) => {
                    const formatted = formatDateInput(e.target.value, newExperience.startDate);
                    setNewExperience({ ...newExperience, startDate: formatted });
                  }}
                  className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                  placeholder="MM/YYYY"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">End Date *</label>
                <input
                  type="text"
                  value={isCurrentRole ? 'Present' : newExperience.endDate}
                  onChange={(e) => {
                    if (!isCurrentRole) {
                      const value = e.target.value;
                      if (value.toLowerCase().includes('present')) {
                        setNewExperience({ ...newExperience, endDate: 'Present' });
                        setIsCurrentRole(true);
                      } else {
                        const formatted = formatDateInput(value, newExperience.endDate);
                        setNewExperience({ ...newExperience, endDate: formatted });
                      }
                    }
                  }}
                  disabled={isCurrentRole}
                  placeholder="MM/YYYY"
                  className={`w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg placeholder-muted focus:border-primary-orange transition-all duration-200 ${
                    isCurrentRole ? 'text-off-white cursor-not-allowed' : 'text-off-white'
                  }`}
                />
                <div className="mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCurrentRole}
                      onChange={(e) => {
                        setIsCurrentRole(e.target.checked);
                        if (e.target.checked) {
                          setNewExperience({ ...newExperience, endDate: 'Present' });
                        } else {
                          setNewExperience({ ...newExperience, endDate: '' });
                        }
                      }}
                      className="w-4 h-4 rounded border-border-grey bg-primary-black accent-primary-orange focus:ring-primary-orange focus:ring-offset-0 focus:ring-2"
                    />
                    <span className="text-sm text-light-grey">Currently at this role</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">URL (optional)</label>
              <input
                type="url"
                value={newExperience.url}
                onChange={(e) => setNewExperience({ ...newExperience, url: e.target.value })}
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Description (optional)</label>
              <textarea
                value={newExperience.description}
                onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200 resize-none"
                placeholder="Describe your experience..."
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => void handleAdd()}
                className="px-6 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200"
              >
                Add Experience
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select All checkbox for export */}
      <div className="mb-4 flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-light-grey cursor-pointer hover:text-off-white transition-colors">
          <input
            type="checkbox"
            checked={selectedExperiences.size === data.experience?.length}
            onChange={toggleAllExperiences}
            className="w-4 h-4 rounded border-border-grey bg-primary-black text-primary-orange focus:ring-primary-orange focus:ring-offset-0"
          />
          <span>Select all for export ({selectedExperiences.size}/{data.experience?.length || 0} selected)</span>
        </label>
      </div>

      {/* List of experiences */}
      <div className="space-y-4">
        {data.experience?.map((exp: any, index: number) => (
          <React.Fragment key={exp._id}>
            {/* Edit form inline */}
            {editingId === exp._id && showAddForm && (
              <div className="bg-near-black border-2 border-primary-orange rounded-xl p-6 animate-scale">
                <h3 className="text-lg font-semibold mb-5 text-off-white">Edit Experience</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Company/Organization *</label>
                    <input
                      type="text"
                      value={newExperience.title}
                      onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                      placeholder="e.g., Google"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Position *</label>
                    <input
                      type="text"
                      value={newExperience.position}
                      onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                      className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Location</label>
                    <input
                      type="text"
                      value={newExperience.location}
                      onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                      className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Employment Type *</label>
                    <input
                      type="text"
                      value={newExperience.employmentType}
                      onChange={(e) => {
                        setNewExperience({ ...newExperience, employmentType: e.target.value });
                        setShowEmploymentDropdown(true);
                      }}
                      onKeyDown={(e) => {
                        if (showEmploymentDropdown) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSelectedEmploymentIndex(prev => prev < employmentTypes.length - 1 ? prev + 1 : prev);
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSelectedEmploymentIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter' && selectedEmploymentIndex >= 0) {
                            e.preventDefault();
                            setNewExperience({ ...newExperience, employmentType: employmentTypes[selectedEmploymentIndex] });
                            setShowEmploymentDropdown(false);
                            setSelectedEmploymentIndex(-1);
                          } else if (e.key === 'Escape') {
                            setShowEmploymentDropdown(false);
                            setSelectedEmploymentIndex(-1);
                          }
                        }
                      }}
                      onFocus={() => setShowEmploymentDropdown(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowEmploymentDropdown(false);
                          setSelectedEmploymentIndex(-1);
                        }, 200);
                      }}
                      placeholder="e.g., Full-time, Internship, Part-time..."
                      className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                    />
                    {showEmploymentDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-near-black border border-border-grey rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {employmentTypes.filter(type =>
                          type.toLowerCase().includes(newExperience.employmentType.toLowerCase()) || !newExperience.employmentType
                        ).slice(0, 5).map((type, index) => (
                          <button
                            key={type}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNewExperience({ ...newExperience, employmentType: type });
                              setShowEmploymentDropdown(false);
                              setSelectedEmploymentIndex(-1);
                            }}
                            className={`w-full px-4 py-3 text-left transition-colors duration-200 text-sm border-b border-border-grey last:border-0 ${
                              selectedEmploymentIndex === index ? 'bg-dark-grey text-off-white' : 'hover:bg-dark-grey text-light-grey hover:text-off-white'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Start Date *</label>
                      <input
                        type="text"
                        value={newExperience.startDate}
                        onChange={(e) => {
                          const formatted = formatDateInput(e.target.value, newExperience.startDate);
                          setNewExperience({ ...newExperience, startDate: formatted });
                        }}
                        className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                        placeholder="MM/YYYY"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">End Date *</label>
                      <input
                        type="text"
                        value={isCurrentRole ? 'Present' : newExperience.endDate}
                        onChange={(e) => {
                          if (!isCurrentRole) {
                            const value = e.target.value;
                            if (value.toLowerCase().includes('present')) {
                              setNewExperience({ ...newExperience, endDate: 'Present' });
                              setIsCurrentRole(true);
                            } else {
                              const formatted = formatDateInput(value, newExperience.endDate);
                              setNewExperience({ ...newExperience, endDate: formatted });
                            }
                          }
                        }}
                        disabled={isCurrentRole}
                        placeholder="MM/YYYY"
                        className={`w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg placeholder-muted focus:border-primary-orange transition-all duration-200 ${
                          isCurrentRole ? 'text-off-white cursor-not-allowed' : 'text-off-white'
                        }`}
                      />
                      <div className="mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isCurrentRole}
                            onChange={(e) => {
                              setIsCurrentRole(e.target.checked);
                              if (e.target.checked) {
                                setNewExperience({ ...newExperience, endDate: 'Present' });
                              } else {
                                setNewExperience({ ...newExperience, endDate: '' });
                              }
                            }}
                            className="w-4 h-4 rounded border-border-grey bg-primary-black accent-primary-orange focus:ring-primary-orange focus:ring-offset-0 focus:ring-2"
                          />
                          <span className="text-sm text-light-grey">Currently at this role</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">URL (optional)</label>
                    <input
                      type="url"
                      value={newExperience.url}
                      onChange={(e) => setNewExperience({ ...newExperience, url: e.target.value })}
                      className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Description (optional)</label>
                    <textarea
                      value={newExperience.description}
                      onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200 resize-none"
                      placeholder="Describe your experience..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => void handleUpdate()}
                      className="px-6 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200"
                    >
                      Update Experience
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setNewExperience({
                          title: "",
                          position: "",
                          location: "",
                          employmentType: "",
                          startDate: "",
                          endDate: "",
                          url: "",
                          description: "",
                        });
                        setIsCurrentRole(false);
                        setShowAddForm(false);
                      }}
                      className="px-6 py-2.5 bg-dark-grey text-light-grey font-medium rounded-lg hover:bg-medium-grey hover:text-off-white transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Experience card */}
            {editingId !== exp._id && (
              <div className="bg-near-black border border-border-grey rounded-xl p-6 hover:border-primary-orange/50 transition-all duration-200 animate-slide-up" style={{animationDelay: `${index * 0.05}s`}}>
                <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedExperiences.has(exp._id)}
                  onChange={() => toggleExperienceSelection(exp._id)}
                  className="w-4 h-4 rounded border-border-grey bg-primary-black text-primary-orange focus:ring-primary-orange focus:ring-offset-0 mt-1"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-off-white">{exp.title}</h3>
                  <p className="text-sm font-medium text-primary-orange mt-1">
                    {exp.position}
                    {exp.location && ` | ${exp.location}`}
                  </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted">
                    {exp.startDate} - {exp.endDate}
                  </span>
                  {exp.employmentType && (
                    <span className="text-xs bg-border-grey/50 text-light-grey px-2 py-0.5 rounded">
                      {exp.employmentType}
                    </span>
                  )}
                </div>
                {exp.url && (
                  <a href={exp.url} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-primary-orange hover:text-orange-hover transition-colors duration-200 mt-2 inline-block">
                    {exp.url}
                  </a>
                )}
                {exp.description && (
                  <p className="mt-4 text-sm text-light-grey whitespace-pre-wrap">
                    {exp.description}
                  </p>
                )}
                </div>
              </div>
              <div className="flex gap-2 ml-4 relative">
                <button
                  onClick={() => handleEdit(exp)}
                  className="px-3 py-1.5 text-xs font-medium border border-border-grey text-light-grey rounded-lg hover:border-primary-orange hover:text-primary-orange transition-all duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingId(exp._id)}
                  className="px-3 py-1.5 text-xs font-medium border border-red-900 text-red-400 rounded-lg hover:bg-red-900/20 transition-all duration-200"
                >
                  Delete
                </button>
                {deletingId === exp._id && (
                  <div className="absolute right-0 top-10 z-20 bg-near-black border-2 border-red-900 rounded-lg p-4 shadow-xl animate-scale">
                    <p className="text-sm text-off-white mb-3 text-center">Are you sure?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleDelete(exp._id)}
                        className="px-4 py-1.5 text-xs font-medium bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-all duration-200 border border-red-900"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-4 py-1.5 text-xs font-medium border border-border-grey text-light-grey rounded-lg hover:border-primary-orange hover:text-primary-orange transition-all duration-200"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
    </div>
  );
}

function ProjectsSection({
  data,
  selectedProjects,
  toggleProjectSelection,
  toggleAllProjects
}: {
  data: any;
  selectedProjects: Set<string>;
  toggleProjectSelection: (id: string) => void;
  toggleAllProjects: () => void;
}) {
  const addProject = useMutation(api.resumeFunctions.addProject);
  const updateProject = useMutation(api.resumeFunctions.updateProject);
  const deleteProject = useMutation(api.resumeFunctions.deleteProject);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCurrentProject, setIsCurrentProject] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    title: "",
    event: "",
    award: "",
    organization: "",
    date: "",
    endDate: "",
    url: "",
    description: "",
  });

  const handleAdd = async () => {
    if (!newProject.title || !newProject.date) {
      alert("Please fill in required fields (title and date)");
      return;
    }

    await addProject({
      ...newProject,
      award: newProject.award || undefined,
    });
    setNewProject({
      title: "",
      event: "",
      award: "",
      organization: "",
      date: "",
      endDate: "",
      url: "",
      description: "",
    });
    setIsCurrentProject(false);
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!newProject.title || !newProject.date) {
      alert("Please fill in required fields (title and date)");
      return;
    }

    if (editingId) {
      await updateProject({
        id: editingId as any,
        ...newProject,
        award: newProject.award || undefined,
      });
      setEditingId(null);
      setNewProject({
        title: "",
        event: "",
        award: "",
        organization: "",
        date: "",
        endDate: "",
        url: "",
        description: "",
      });
      setIsCurrentProject(false);
      setShowAddForm(false);
    }
  };

  const handleEdit = (project: any) => {
    setEditingId(project._id);
    setIsCurrentProject(project.endDate === 'Present');

    // Handle award - convert array to string if needed (for backwards compatibility)
    let awardString = "";
    if (project.award) {
      awardString = Array.isArray(project.award) ? project.award.join(", ") : project.award;
    }

    setNewProject({
      title: project.title,
      event: project.event || "",
      award: awardString,
      organization: project.organization || "",
      date: project.date,
      endDate: project.endDate || "",
      url: project.url || "",
      description: project.description || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteProject({ id: id as any });
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-off-white">Projects</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200 text-sm"
        >
          {showAddForm ? "Cancel" : "+ Add Project"}
        </button>
      </div>

      {showAddForm && !editingId && (
        <div className="bg-near-black border-2 border-primary-orange rounded-xl p-6 animate-scale">
          <h3 className="text-lg font-semibold mb-5 text-off-white">Add New Project</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Title *</label>
              <input
                type="text"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Date *</label>
                <input
                  type="text"
                  value={newProject.date}
                  onChange={(e) => {
                    const formatted = formatDateInput(e.target.value, newProject.date);
                    setNewProject({ ...newProject, date: formatted });
                  }}
                  className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                  placeholder="MM/YYYY"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">End Date (optional)</label>
                <input
                  type="text"
                  value={isCurrentProject ? 'Present' : newProject.endDate}
                  onChange={(e) => {
                    if (!isCurrentProject) {
                      const value = e.target.value;
                      if (value.toLowerCase().includes('present')) {
                        setNewProject({ ...newProject, endDate: 'Present' });
                        setIsCurrentProject(true);
                      } else {
                        const formatted = formatDateInput(value, newProject.endDate);
                        setNewProject({ ...newProject, endDate: formatted });
                      }
                    }
                  }}
                  disabled={isCurrentProject}
                  placeholder="MM/YYYY"
                  className={`w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg placeholder-muted focus:border-primary-orange transition-all duration-200 ${
                    isCurrentProject ? 'text-off-white cursor-not-allowed' : 'text-off-white'
                  }`}
                />
                <div className="mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCurrentProject}
                      onChange={(e) => {
                        setIsCurrentProject(e.target.checked);
                        if (e.target.checked) {
                          setNewProject({ ...newProject, endDate: 'Present' });
                        } else {
                          setNewProject({ ...newProject, endDate: '' });
                        }
                      }}
                      className="w-4 h-4 rounded border-border-grey bg-primary-black accent-primary-orange focus:ring-primary-orange focus:ring-offset-0 focus:ring-2"
                    />
                    <span className="text-sm text-light-grey">Still working on this project</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Event (optional)</label>
                <input
                  type="text"
                  value={newProject.event}
                  onChange={(e) => setNewProject({ ...newProject, event: e.target.value })}
                  className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                  placeholder="e.g., YC Agents Hackathon"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Awards (optional)</label>
                <input
                  type="text"
                  value={newProject.award}
                  onChange={(e) => setNewProject({ ...newProject, award: e.target.value })}
                  className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                  placeholder="e.g., First Place, Best Design"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Organization (optional)</label>
              <input
                type="text"
                value={newProject.organization}
                onChange={(e) => setNewProject({ ...newProject, organization: e.target.value })}
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">URL (optional)</label>
              <input
                type="url"
                value={newProject.url}
                onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Description (optional)</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200 resize-none"
                placeholder="Describe your project..."
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => void handleAdd()}
                className="px-6 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200"
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select All checkbox for export */}
      <div className="mb-4 flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-light-grey cursor-pointer hover:text-off-white transition-colors">
          <input
            type="checkbox"
            checked={selectedProjects.size === data.projects?.length}
            onChange={toggleAllProjects}
            className="w-4 h-4 rounded border-border-grey bg-primary-black text-primary-orange focus:ring-primary-orange focus:ring-offset-0"
          />
          <span>Select all for export ({selectedProjects.size}/{data.projects?.length || 0} selected)</span>
        </label>
      </div>

      {/* List of projects */}
      <div className="space-y-4">
        {data.projects?.map((project: any, index: number) => (
          <React.Fragment key={project._id}>
            {/* Edit form inline */}
            {editingId === project._id && showAddForm && (
              <div className="bg-near-black border-2 border-primary-orange rounded-xl p-6 animate-scale">
                <h3 className="text-lg font-semibold mb-5 text-off-white">Edit Project</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Title *</label>
                    <input
                      type="text"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Date *</label>
                      <input
                        type="text"
                        value={newProject.date}
                        onChange={(e) => {
                          const formatted = formatDateInput(e.target.value, newProject.date);
                          setNewProject({ ...newProject, date: formatted });
                        }}
                        className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                        placeholder="MM/YYYY"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">End Date (optional)</label>
                      <input
                        type="text"
                        value={isCurrentProject ? 'Present' : newProject.endDate}
                        onChange={(e) => {
                          if (!isCurrentProject) {
                            const value = e.target.value;
                            if (value.toLowerCase().includes('present')) {
                              setNewProject({ ...newProject, endDate: 'Present' });
                              setIsCurrentProject(true);
                            } else {
                              const formatted = formatDateInput(value, newProject.endDate);
                              setNewProject({ ...newProject, endDate: formatted });
                            }
                          }
                        }}
                        disabled={isCurrentProject}
                        placeholder="MM/YYYY"
                        className={`w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg placeholder-muted focus:border-primary-orange transition-all duration-200 ${
                          isCurrentProject ? 'text-off-white cursor-not-allowed' : 'text-off-white'
                        }`}
                      />
                      <div className="mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isCurrentProject}
                            onChange={(e) => {
                              setIsCurrentProject(e.target.checked);
                              if (e.target.checked) {
                                setNewProject({ ...newProject, endDate: 'Present' });
                              } else {
                                setNewProject({ ...newProject, endDate: '' });
                              }
                            }}
                            className="w-4 h-4 rounded border-border-grey bg-primary-black accent-primary-orange focus:ring-primary-orange focus:ring-offset-0 focus:ring-2"
                          />
                          <span className="text-sm text-light-grey">Still working on this project</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Event (optional)</label>
                      <input
                        type="text"
                        value={newProject.event}
                        onChange={(e) => setNewProject({ ...newProject, event: e.target.value })}
                        className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                        placeholder="e.g., YC Agents Hackathon"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Awards (optional)</label>
                      <input
                        type="text"
                        value={newProject.award}
                        onChange={(e) => setNewProject({ ...newProject, award: e.target.value })}
                        className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                        placeholder="e.g., First Place, Best Design"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Organization (optional)</label>
                    <input
                      type="text"
                      value={newProject.organization}
                      onChange={(e) => setNewProject({ ...newProject, organization: e.target.value })}
                      className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">URL (optional)</label>
                    <input
                      type="url"
                      value={newProject.url}
                      onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
                      className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Description (optional)</label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200 resize-none"
                      placeholder="Describe your project..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => void handleUpdate()}
                      className="px-6 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200"
                    >
                      Update Project
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setNewProject({
                          title: "",
                          event: "",
                          award: "",
                          organization: "",
                          date: "",
                          endDate: "",
                          url: "",
                          description: "",
                        });
                        setIsCurrentProject(false);
                        setShowAddForm(false);
                      }}
                      className="px-6 py-2.5 bg-dark-grey text-light-grey font-medium rounded-lg hover:bg-medium-grey hover:text-off-white transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Project card */}
            {editingId !== project._id && (
              <div className="bg-near-black border border-border-grey rounded-xl p-6 hover:border-primary-orange/50 transition-all duration-200 animate-slide-up" style={{animationDelay: `${index * 0.05}s`}}>
                <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedProjects.has(project._id)}
                  onChange={() => toggleProjectSelection(project._id)}
                  className="w-4 h-4 rounded border-border-grey bg-primary-black text-primary-orange focus:ring-primary-orange focus:ring-offset-0 mt-1"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-off-white">{project.title}</h3>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs text-muted">
                    {project.date} {project.endDate && `- ${project.endDate}`}
                  </span>
                  {project.event && (
                    <span className="text-xs text-primary-orange">
                      {project.event}
                    </span>
                  )}
                  {project.award && project.award.length > 0 && (
                    <span className="text-xs bg-primary-orange/10 text-primary-orange px-2 py-0 rounded-md font-medium">
                      🏆 {Array.isArray(project.award) ? project.award.join(", ") : project.award}
                    </span>
                  )}
                </div>
                {project.organization && (
                  <p className="text-xs text-light-grey mt-2">
                    {project.organization}
                  </p>
                )}
                {project.url && (
                  <a href={project.url} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-primary-orange hover:text-orange-hover transition-colors duration-200 mt-2 inline-block">
                    {project.url}
                  </a>
                )}
                {project.description && (
                  <p className="mt-4 text-sm text-light-grey whitespace-pre-wrap">
                    {project.description}
                  </p>
                )}
                </div>
              </div>
              <div className="flex gap-2 ml-4 relative">
                <button
                  onClick={() => handleEdit(project)}
                  className="px-3 py-1.5 text-xs font-medium border border-border-grey text-light-grey rounded-lg hover:border-primary-orange hover:text-primary-orange transition-all duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingId(project._id)}
                  className="px-3 py-1.5 text-xs font-medium border border-red-900 text-red-400 rounded-lg hover:bg-red-900/20 transition-all duration-200"
                >
                  Delete
                </button>
                {deletingId === project._id && (
                  <div className="absolute right-0 top-10 z-20 bg-near-black border-2 border-red-900 rounded-lg p-4 shadow-xl animate-scale">
                    <p className="text-sm text-off-white mb-3 text-center">Are you sure?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleDelete(project._id)}
                        className="px-4 py-1.5 text-xs font-medium bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-all duration-200 border border-red-900"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-4 py-1.5 text-xs font-medium border border-border-grey text-light-grey rounded-lg hover:border-primary-orange hover:text-primary-orange transition-all duration-200"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
    </div>
  );
}