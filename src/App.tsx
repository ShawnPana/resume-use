import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

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
      <label className="block text-sm font-medium mb-2">{label}</label>

      {/* Display existing items as tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {items.map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            {item}
            <button
              onClick={() => removeItem(index)}
              className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Add new item input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
        />
        <button
          onClick={addItem}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const resumeData = useQuery(api.resumeFunctions.getFullResume);
  const [activeSection, setActiveSection] = useState<"about" | "experience" | "projects">("about");

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-light dark:bg-dark flex items-center justify-center">
        <div className="text-xl">Loading resume data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light dark:bg-dark">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Resume Manager</h1>
          <nav className="mt-4 flex gap-4">
            <button
              onClick={() => setActiveSection("about")}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeSection === "about"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveSection("experience")}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeSection === "experience"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Experience ({resumeData.experience?.length || 0})
            </button>
            <button
              onClick={() => setActiveSection("projects")}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeSection === "projects"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Projects ({resumeData.projects?.length || 0})
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        {activeSection === "about" && <AboutSection data={resumeData} />}
        {activeSection === "experience" && <ExperienceSection data={resumeData} />}
        {activeSection === "projects" && <ProjectsSection data={resumeData} />}
      </main>
    </div>
  );
}

function AboutSection({ data }: { data: any }) {
  const updateHeader = useMutation(api.resumeFunctions.upsertHeader);
  const updateEducation = useMutation(api.resumeFunctions.upsertEducation);

  const [headerForm, setHeaderForm] = useState({
    name: data.header?.name || "",
    tagline: data.header?.tagline || "",
    email: data.header?.email || "",
    website: data.header?.website || "",
    linkedin: data.header?.linkedin || "",
    github: data.header?.github || "",
    lastUpdated: data.header?.lastUpdated || "",
    skills: data.header?.skills || {
      languages: [],
      webDevelopment: [],
      aiML: [],
      cloudData: [],
      tools: [],
    },
  });

  const [educationForm, setEducationForm] = useState({
    university: data.education?.university || "",
    degree: data.education?.degree || "",
    major: data.education?.major || "",
    startDate: data.education?.startDate || "",
    endDate: data.education?.endDate || "",
    gpa: data.education?.gpa || "",
    coursework: data.education?.coursework || [],
  });

  const handleHeaderSave = async () => {
    await updateHeader(headerForm);
    alert("Header updated successfully!");
  };

  const handleEducationSave = async () => {
    await updateEducation(educationForm);
    alert("Education updated successfully!");
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.header?.name || "Not set"}
            </div>
            <input
              type="text"
              value={headerForm.name}
              onChange={(e) => setHeaderForm({ ...headerForm, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.header?.email || "Not set"}
            </div>
            <input
              type="email"
              value={headerForm.email}
              onChange={(e) => setHeaderForm({ ...headerForm, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tagline</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.header?.tagline || "Not set"}
            </div>
            <input
              type="text"
              value={headerForm.tagline}
              onChange={(e) => setHeaderForm({ ...headerForm, tagline: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.header?.website || "Not set"}
            </div>
            <input
              type="url"
              value={headerForm.website}
              onChange={(e) => setHeaderForm({ ...headerForm, website: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">LinkedIn</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.header?.linkedin || "Not set"}
            </div>
            <input
              type="url"
              value={headerForm.linkedin}
              onChange={(e) => setHeaderForm({ ...headerForm, linkedin: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">GitHub</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.header?.github || "Not set"}
            </div>
            <input
              type="url"
              value={headerForm.github}
              onChange={(e) => setHeaderForm({ ...headerForm, github: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

        </div>

        {/* Skills Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Skills</h3>
          <div className="space-y-6">
            {Object.entries(headerForm.skills).map(([category, skills]) => (
              <div key={category} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="mb-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Current in database: {(data.header?.skills?.[category] || []).join(", ") || "None"}
                  </div>
                </div>
                <TagManager
                  label={category.replace(/([A-Z])/g, ' $1').trim()}
                  items={skills as string[]}
                  onItemsChange={(newSkills) => {
                    setHeaderForm({
                      ...headerForm,
                      skills: { ...headerForm.skills, [category]: newSkills }
                    });
                  }}
                  placeholder={`Add ${category.replace(/([A-Z])/g, ' $1').trim().toLowerCase()} skill...`}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleHeaderSave}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Header Information
        </button>
      </div>

      {/* Education Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">Education</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">University</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.education?.university || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.university}
              onChange={(e) => setEducationForm({ ...educationForm, university: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Degree</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.education?.degree || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.degree}
              onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Major</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.education?.major || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.major}
              onChange={(e) => setEducationForm({ ...educationForm, major: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.education?.startDate || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.startDate}
              onChange={(e) => setEducationForm({ ...educationForm, startDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.education?.endDate || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.endDate}
              onChange={(e) => setEducationForm({ ...educationForm, endDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">GPA</label>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current: {data.education?.gpa || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.gpa}
              onChange={(e) => setEducationForm({ ...educationForm, gpa: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="md:col-span-2">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Current in database: {(data.education?.coursework || []).join(", ") || "None"}
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

        <button
          onClick={handleEducationSave}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Education Information
        </button>
      </div>
    </div>
  );
}

function ExperienceSection({ data }: { data: any }) {
  const addExperience = useMutation(api.resumeFunctions.addExperience);
  const updateExperience = useMutation(api.resumeFunctions.updateExperience);
  const deleteExperience = useMutation(api.resumeFunctions.deleteExperience);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExperience, setNewExperience] = useState({
    title: "",
    position: "",
    startDate: "",
    endDate: "",
    url: "",
    highlights: [] as string[],
  });

  const handleAdd = async () => {
    if (!newExperience.title || !newExperience.position || !newExperience.startDate || !newExperience.endDate) {
      alert("Please fill in required fields (company, position, start date, end date)");
      return;
    }

    await addExperience(newExperience);
    setNewExperience({
      title: "",
      position: "",
      startDate: "",
      endDate: "",
      url: "",
      highlights: [],
    });
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!newExperience.title || !newExperience.position || !newExperience.startDate || !newExperience.endDate) {
      alert("Please fill in required fields (company, position, start date, end date)");
      return;
    }

    if (editingId) {
      await updateExperience({
        id: editingId as any,
        ...newExperience,
      });
      setEditingId(null);
      setNewExperience({
        title: "",
        position: "",
        startDate: "",
        endDate: "",
        url: "",
        highlights: [],
      });
    }
  };

  const handleEdit = (exp: any) => {
    setEditingId(exp._id);
    setNewExperience({
      title: exp.title,
      position: exp.position || "",
      startDate: exp.startDate,
      endDate: exp.endDate,
      url: exp.url || "",
      highlights: exp.highlights || [],
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this experience?")) {
      await deleteExperience({ id: id as any });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Experience</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          {showAddForm ? "Cancel" : "Add New Experience"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border-2 border-green-500">
          <h3 className="text-lg font-bold mb-4">{editingId ? "Edit Experience" : "Add New Experience"}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company/Organization *</label>
              <input
                type="text"
                value={newExperience.title}
                onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="e.g., Google"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Position *</label>
              <input
                type="text"
                value={newExperience.position}
                onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input
                  type="text"
                  value={newExperience.startDate}
                  onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., June 2023"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date *</label>
                <input
                  type="text"
                  value={newExperience.endDate}
                  onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Present"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL (optional)</label>
              <input
                type="url"
                value={newExperience.url}
                onChange={(e) => setNewExperience({ ...newExperience, url: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="https://..."
              />
            </div>

            <div>
              <TagManager
                label="Highlights"
                items={newExperience.highlights}
                onItemsChange={(highlights) => {
                  setNewExperience({ ...newExperience, highlights });
                }}
                placeholder="Add highlight..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {editingId ? "Update Experience" : "Add Experience"}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setNewExperience({
                      title: "",
                      position: "",
                      startDate: "",
                      endDate: "",
                      url: "",
                      highlights: [],
                    });
                    setShowAddForm(false);
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List of experiences */}
      <div className="space-y-4">
        {data.experience?.map((exp: any, index: number) => (
          editingId === exp._id ? (
            // Edit form inline
            <div key={exp._id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border-2 border-yellow-500">
              <h3 className="text-lg font-bold mb-4">Edit Experience</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company/Organization *</label>
                  <input
                    type="text"
                    value={newExperience.title}
                    onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., Google"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Position *</label>
                  <input
                    type="text"
                    value={newExperience.position}
                    onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date *</label>
                    <input
                      type="text"
                      value={newExperience.startDate}
                      onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                      placeholder="e.g., June 2023"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">End Date *</label>
                    <input
                      type="text"
                      value={newExperience.endDate}
                      onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                      placeholder="e.g., Present"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">URL (optional)</label>
                  <input
                    type="url"
                    value={newExperience.url}
                    onChange={(e) => setNewExperience({ ...newExperience, url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <TagManager
                    label="Highlights"
                    items={newExperience.highlights}
                    onItemsChange={(highlights) => {
                      setNewExperience({ ...newExperience, highlights });
                    }}
                    placeholder="Add highlight..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Update Experience
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setNewExperience({
                        title: "",
                        position: "",
                        startDate: "",
                        endDate: "",
                        url: "",
                        highlights: [],
                      });
                    }}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Regular experience card
            <div key={exp._id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{exp.title}</h3>
                  <p className="text-sm font-medium">{exp.position}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {exp.startDate} - {exp.endDate}
                  </p>
                  {exp.url && (
                    <a href={exp.url} target="_blank" rel="noopener noreferrer"
                       className="text-sm text-blue-600 hover:underline">
                      {exp.url}
                    </a>
                  )}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {exp.highlights.map((highlight: string, idx: number) => (
                        <li key={idx} className="text-sm">• {highlight}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(exp)}
                    className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(exp._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function ProjectsSection({ data }: { data: any }) {
  const addProject = useMutation(api.resumeFunctions.addProject);
  const updateProject = useMutation(api.resumeFunctions.updateProject);
  const deleteProject = useMutation(api.resumeFunctions.deleteProject);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    title: "",
    event: "",
    award: [] as string[],
    organization: "",
    date: "",
    endDate: "",
    url: "",
    highlights: [] as string[],
  });

  const handleAdd = async () => {
    if (!newProject.title || !newProject.date) {
      alert("Please fill in required fields (title and date)");
      return;
    }

    await addProject({
      ...newProject,
      award: newProject.award.length > 0 ? newProject.award : undefined,
    });
    setNewProject({
      title: "",
      event: "",
      award: [],
      organization: "",
      date: "",
      endDate: "",
      url: "",
      highlights: [],
    });
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
        award: newProject.award.length > 0 ? newProject.award : undefined,
      });
      setEditingId(null);
      setNewProject({
        title: "",
        event: "",
        award: [],
        organization: "",
        date: "",
        endDate: "",
        url: "",
        highlights: [],
      });
    }
  };

  const handleEdit = (project: any) => {
    setEditingId(project._id);
    // Handle award as string or array
    let awards: string[] = [];
    if (project.award) {
      awards = Array.isArray(project.award) ? project.award : [project.award];
    }

    setNewProject({
      title: project.title,
      event: project.event || "",
      award: awards,
      organization: project.organization || "",
      date: project.date,
      endDate: project.endDate || "",
      url: project.url || "",
      highlights: project.highlights || [],
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteProject({ id: id as any });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          {showAddForm ? "Cancel" : "Add New Project"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border-2 border-green-500">
          <h3 className="text-lg font-bold mb-4">{editingId ? "Edit Project" : "Add New Project"}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="text"
                  value={newProject.date}
                  onChange={(e) => setNewProject({ ...newProject, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., August 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date (optional)</label>
                <input
                  type="text"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event (optional)</label>
                <input
                  type="text"
                  value={newProject.event}
                  onChange={(e) => setNewProject({ ...newProject, event: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., YC Agents Hackathon"
                />
              </div>

              <div>
                <TagManager
                  label="Awards (optional)"
                  items={newProject.award}
                  onItemsChange={(awards) => {
                    setNewProject({ ...newProject, award: awards });
                  }}
                  placeholder="e.g., First Place"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Organization (optional)</label>
              <input
                type="text"
                value={newProject.organization}
                onChange={(e) => setNewProject({ ...newProject, organization: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL (optional)</label>
              <input
                type="url"
                value={newProject.url}
                onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <TagManager
                label="Highlights"
                items={newProject.highlights}
                onItemsChange={(highlights) => {
                  setNewProject({ ...newProject, highlights });
                }}
                placeholder="Add highlight..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {editingId ? "Update Project" : "Add Project"}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setNewProject({
                      title: "",
                      event: "",
                      award: [],
                      organization: "",
                      date: "",
                      endDate: "",
                      url: "",
                      highlights: [],
                    });
                    setShowAddForm(false);
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List of projects */}
      <div className="space-y-4">
        {data.projects?.map((project: any) => (
          editingId === project._id ? (
            // Edit form inline
            <div key={project._id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border-2 border-yellow-500">
              <h3 className="text-lg font-bold mb-4">Edit Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      type="text"
                      value={newProject.date}
                      onChange={(e) => setNewProject({ ...newProject, date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                      placeholder="e.g., August 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">End Date (optional)</label>
                    <input
                      type="text"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Event (optional)</label>
                    <input
                      type="text"
                      value={newProject.event}
                      onChange={(e) => setNewProject({ ...newProject, event: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                      placeholder="e.g., YC Agents Hackathon"
                    />
                  </div>

                  <div>
                    <TagManager
                      label="Awards (optional)"
                      items={newProject.award}
                      onItemsChange={(awards) => {
                        setNewProject({ ...newProject, award: awards });
                      }}
                      placeholder="e.g., First Place"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Organization (optional)</label>
                  <input
                    type="text"
                    value={newProject.organization}
                    onChange={(e) => setNewProject({ ...newProject, organization: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">URL (optional)</label>
                  <input
                    type="url"
                    value={newProject.url}
                    onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div>
                  <TagManager
                    label="Highlights"
                    items={newProject.highlights}
                    onItemsChange={(highlights) => {
                      setNewProject({ ...newProject, highlights });
                    }}
                    placeholder="Add highlight..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Update Project
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setNewProject({
                        title: "",
                        event: "",
                        award: [],
                        organization: "",
                        date: "",
                        endDate: "",
                        url: "",
                        highlights: [],
                      });
                    }}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Regular project card
            <div key={project._id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{project.title}</h3>
                  <div className="flex gap-3 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {project.date} {project.endDate && `- ${project.endDate}`}
                    </span>
                    {project.event && (
                      <span className="text-sm text-blue-600">
                        {project.event}
                      </span>
                    )}
                    {project.award && project.award.length > 0 && (
                      <span className="text-sm text-green-600 font-semibold">
                        🏆 {Array.isArray(project.award) ? project.award.join(", ") : project.award}
                      </span>
                    )}
                  </div>
                  {project.organization && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {project.organization}
                    </p>
                  )}
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer"
                       className="text-sm text-blue-600 hover:underline">
                      {project.url}
                    </a>
                  )}
                  {project.highlights && project.highlights.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {project.highlights.map((highlight: string, idx: number) => (
                        <li key={idx} className="text-sm">• {highlight}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(project)}
                    className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}