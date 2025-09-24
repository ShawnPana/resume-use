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
      {label && <label className="block text-xs font-medium text-light-grey mb-3 uppercase tracking-wider">{label}</label>}

      {/* Display existing items as tags */}
      <div className="flex flex-wrap gap-2 mb-3">
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

export default function App() {
  const resumeData = useQuery(api.resumeFunctions.getFullResume);
  const [activeSection, setActiveSection] = useState<"about" | "experience" | "projects">("about");

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
            <h1 className="text-xl font-semibold text-off-white tracking-tight">Resume Manager</h1>
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
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
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
    // Convert skills array back to object format
    const skillsObject: Record<string, string[]> = {};
    skillCategories.forEach(({ category, items }) => {
      if (category.trim()) {
        skillsObject[category] = items;
      }
    });

    await updateHeader({
      ...headerForm,
      skills: skillsObject
    });
    alert("Header updated successfully!");
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
    alert("Education updated successfully!");
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
            <h3 className="text-base font-semibold text-off-white">Skills</h3>
            <button
              onClick={addSkillCategory}
              className="px-4 py-2 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200 text-sm flex items-center gap-2"
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
              <div key={index} className="bg-primary-black border border-border-grey rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {/* Main content area - full width */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    {/* Category Name Input - 50% width */}
                    <div>
                      <input
                        type="text"
                        value={skillCat.category}
                        onChange={(e) => updateSkillCategory(index, 'category', e.target.value)}
                        placeholder="Category name"
                        className="w-full px-4 py-2.5 bg-near-black border border-border-grey rounded-lg text-sm text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                      />
                    </div>

                    {/* Skills section - 50% width */}
                    <div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {/* Existing skill tags */}
                        {skillCat.items.map((item, itemIndex) => (
                          <span
                            key={itemIndex}
                            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm bg-dark-grey border border-border-grey text-light-grey hover:border-primary-orange transition-colors duration-200"
                          >
                            {item}
                            <button
                              onClick={() => {
                                const newItems = skillCat.items.filter((_, i) => i !== itemIndex);
                                updateSkillCategory(index, 'items', newItems);
                              }}
                              className="ml-2 text-muted hover:text-primary-orange transition-colors duration-200 text-lg leading-none"
                            >
                              ×
                            </button>
                          </span>
                        ))}

                        {/* Add skill input */}
                        <input
                          type="text"
                          placeholder="Comma-separated skills"
                          className="flex-1 min-w-[200px] px-4 py-2.5 bg-near-black border border-border-grey rounded-lg text-sm placeholder-muted focus:border-primary-orange transition-all duration-200"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              const value = input.value.trim();
                              if (value && !skillCat.items.includes(value)) {
                                updateSkillCategory(index, 'items', [...skillCat.items, value]);
                                input.value = '';
                              }
                            }
                          }}
                          onChange={(e) => {
                            const input = e.target as HTMLInputElement;
                            if (input.value.includes(',')) {
                              const values = input.value.split(',');
                              const newSkill = values[0].trim();
                              if (newSkill && !skillCat.items.includes(newSkill)) {
                                updateSkillCategory(index, 'items', [...skillCat.items, newSkill]);
                              }
                              // Keep any text after the comma
                              input.value = values.slice(1).join(',').trim();
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeSkillCategory(index)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    title="Remove category"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {skillCategories.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-border-grey rounded-lg">
                <p className="text-muted mb-3">No skill categories added yet</p>
                <button
                  onClick={addSkillCategory}
                  className="px-4 py-2 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200 text-sm"
                >
                  Add Your First Category
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleHeaderSave}
          className="mt-6 px-6 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200"
        >
          Save Header Information
        </button>
      </div>

      {/* Education Section */}
      <div className="bg-near-black border border-border-grey rounded-xl p-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
        <h2 className="text-lg font-semibold mb-6 text-off-white">Education</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">University</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.education?.university || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.university}
              onChange={(e) => setEducationForm({ ...educationForm, university: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Degree</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.education?.degree || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.degree}
              onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Major</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.education?.major || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.major}
              onChange={(e) => setEducationForm({ ...educationForm, major: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Start Date</label>
            <div className="text-xs text-muted mb-2">
              Current: {data.education?.startDate || "Not set"}
            </div>
            <input
              type="text"
              value={educationForm.startDate}
              onChange={(e) => setEducationForm({ ...educationForm, startDate: e.target.value })}
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
              onChange={(e) => setEducationForm({ ...educationForm, endDate: e.target.value })}
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

        <button
          onClick={handleEducationSave}
          className="mt-6 px-6 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200"
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
        <h2 className="text-xl font-semibold text-off-white">Experience</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200 text-sm"
        >
          {showAddForm ? "Cancel" : "+ Add Experience"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-near-black border-2 border-primary-orange rounded-xl p-6 animate-scale">
          <h3 className="text-lg font-semibold mb-5 text-off-white">{editingId ? "Edit Experience" : "Add New Experience"}</h3>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">Start Date *</label>
                <input
                  type="text"
                  value={newExperience.startDate}
                  onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                  placeholder="e.g., June 2023"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">End Date *</label>
                <input
                  type="text"
                  value={newExperience.endDate}
                  onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                  placeholder="e.g., Present"
                />
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
              <TagManager
                label="Highlights"
                items={newExperience.highlights}
                onItemsChange={(highlights) => {
                  setNewExperience({ ...newExperience, highlights });
                }}
                placeholder="Add highlight..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="px-6 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200"
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
                  className="px-6 py-2.5 bg-dark-grey text-light-grey font-medium rounded-lg hover:bg-medium-grey hover:text-off-white transition-all duration-200"
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
            <div key={exp._id} className="bg-near-black border-2 border-primary-orange rounded-xl p-6 animate-scale">
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
            <div key={exp._id} className="bg-near-black border border-border-grey rounded-xl p-6 hover:border-primary-orange/50 transition-all duration-200 animate-slide-up" style={{animationDelay: `${index * 0.05}s`}}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-off-white">{exp.title}</h3>
                  <p className="text-sm font-medium text-primary-orange mt-1">{exp.position}</p>
                  <p className="text-xs text-muted mt-2">
                    {exp.startDate} - {exp.endDate}
                  </p>
                  {exp.url && (
                    <a href={exp.url} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-primary-orange hover:text-orange-hover transition-colors duration-200 mt-2 inline-block">
                      {exp.url}
                    </a>
                  )}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {exp.highlights.map((highlight: string, idx: number) => (
                        <li key={idx} className="text-sm text-light-grey flex items-start">
                          <span className="text-primary-orange mr-2">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(exp)}
                    className="px-3 py-1.5 text-xs font-medium border border-border-grey text-light-grey rounded-lg hover:border-primary-orange hover:text-primary-orange transition-all duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(exp._id)}
                    className="px-3 py-1.5 text-xs font-medium border border-red-900 text-red-400 rounded-lg hover:bg-red-900/20 transition-all duration-200"
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
        <h2 className="text-xl font-semibold text-off-white">Projects</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200 text-sm"
        >
          {showAddForm ? "Cancel" : "+ Add Project"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-near-black border-2 border-primary-orange rounded-xl p-6 animate-scale">
          <h3 className="text-lg font-semibold mb-5 text-off-white">{editingId ? "Edit Project" : "Add New Project"}</h3>
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
                  onChange={(e) => setNewProject({ ...newProject, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                  placeholder="e.g., August 2025"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">End Date (optional)</label>
                <input
                  type="text"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                />
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
              <TagManager
                label="Highlights"
                items={newProject.highlights}
                onItemsChange={(highlights) => {
                  setNewProject({ ...newProject, highlights });
                }}
                placeholder="Add highlight..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="px-6 py-2.5 bg-primary-orange text-primary-black font-medium rounded-lg hover:bg-orange-hover transition-all duration-200"
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
                  className="px-6 py-2.5 bg-dark-grey text-light-grey font-medium rounded-lg hover:bg-medium-grey hover:text-off-white transition-all duration-200"
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
        {data.projects?.map((project: any, index: number) => (
          editingId === project._id ? (
            // Edit form inline
            <div key={project._id} className="bg-near-black border-2 border-primary-orange rounded-xl p-6 animate-scale">
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
            <div key={project._id} className="bg-near-black border border-border-grey rounded-xl p-6 hover:border-primary-orange/50 transition-all duration-200 animate-slide-up" style={{animationDelay: `${index * 0.05}s`}}>
              <div className="flex justify-between items-start">
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
                      <span className="text-xs bg-primary-orange/10 text-primary-orange px-2 py-1 rounded-md font-medium">
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
                  {project.highlights && project.highlights.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {project.highlights.map((highlight: string, idx: number) => (
                        <li key={idx} className="text-sm text-light-grey flex items-start">
                          <span className="text-primary-orange mr-2">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(project)}
                    className="px-3 py-1.5 text-xs font-medium border border-border-grey text-light-grey rounded-lg hover:border-primary-orange hover:text-primary-orange transition-all duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="px-3 py-1.5 text-xs font-medium border border-red-900 text-red-400 rounded-lg hover:bg-red-900/20 transition-all duration-200"
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