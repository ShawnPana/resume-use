import os
import json
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from convex import ConvexClient

# Load environment variables from .env.local file in parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"))

# Get Convex URL from environment
CONVEX_URL = os.getenv('VITE_CONVEX_URL', 'https://calculating-toad-355.convex.cloud')

# Initialize Convex client
client = ConvexClient(CONVEX_URL)

def get_full_resume() -> Dict:
    """
    Get all resume data (header, education, experience, projects)

    Returns:
        Complete resume data as a dictionary
    """
    return client.query("resumeFunctions:getFullResume")

def get_header() -> Optional[Dict]:
    """
    Get header/personal information

    Returns:
        Header data including name, email, skills, etc.
    """
    return client.query("resumeFunctions:getHeader")

def get_education() -> Optional[Dict]:
    """
    Get education information

    Returns:
        Education data including university, degree, major, etc.
    """
    return client.query("resumeFunctions:getEducation")

def get_experience() -> List[Dict]:
    """
    Get all experience entries

    Returns:
        List of experience entries with title, position, dates, etc.
    """
    return client.query("resumeFunctions:getExperience")

def get_projects() -> List[Dict]:
    """
    Get all project entries

    Returns:
        List of project entries with title, awards, highlights, etc.
    """
    return client.query("resumeFunctions:getProjects")

def export_resume_to_json(filename: str = "resume_data.json") -> str:
    """
    Export all resume data to a JSON file

    Args:
        filename: Name of the output JSON file

    Returns:
        Path to the created file
    """
    resume_data = get_full_resume()

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(resume_data, f, indent=2, ensure_ascii=False)

    print(f"Resume data exported to {filename}")
    return filename

def print_resume_summary():
    """
    Print a summary of the resume data
    """
    try:
        data = get_full_resume()

        print("=== RESUME DATA SUMMARY ===")

        # Header info
        if data.get('header'):
            header = data['header']
            print(f"Name: {header.get('name', 'N/A')}")
            print(f"Email: {header.get('email', 'N/A')}")
            print(f"Tagline: {header.get('tagline', 'N/A')}")

            if header.get('skills'):
                skills = header['skills']
                total_skills = sum(len(skill_list) for skill_list in skills.values() if skill_list)
                print(f"Total Skills: {total_skills}")

        # Education
        if data.get('education'):
            edu = data['education']
            print(f"Education: {edu.get('degree', 'N/A')} in {edu.get('major', 'N/A')} from {edu.get('university', 'N/A')}")

        # Experience count
        exp_count = len(data.get('experience', []))
        print(f"Experience Entries: {exp_count}")

        # Projects count
        proj_count = len(data.get('projects', []))
        print(f"Project Entries: {proj_count}")

        print("========================")

    except Exception as e:
        print(f"Error fetching resume data: {e}")

def escape_latex(text: str) -> str:
    """
    Escape special LaTeX characters in text
    """
    if not text:
        return ""

    # LaTeX special characters that need escaping
    special_chars = {
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
        '\\': r'\textbackslash{}',
    }

    result = text
    for char, replacement in special_chars.items():
        result = result.replace(char, replacement)

    return result

def export_to_latex(output_file: str = "resume.tex") -> str:
    """
    Export resume data to a complete LaTeX document

    Args:
        output_file: Output LaTeX file path

    Returns:
        Path to the created file
    """
    try:
        data = get_full_resume()

        latex_content = []

        # Add the LaTeX preamble (document setup, packages, custom commands)
        latex_content.append(r"""\documentclass[11pt, letterpaper]{article}

% Packages:
\usepackage[
    ignoreheadfoot, % set margins without considering header and footer
    top=1.0 cm, % seperation between body and page edge from the top
    bottom=0.5 cm, % seperation between body and page edge from the bottom
    left=0.5 cm, % seperation between body and page edge from the left
    right=0.5 cm, % seperation between body and page edge from the right
    footskip=1.0 cm, % seperation between body and footer
    % showframe % for debugging
]{geometry} % for adjusting page geometry
\usepackage{titlesec} % for customizing section titles
\usepackage{tabularx} % for making tables with fixed width columns
\usepackage{array} % tabularx requires this
\usepackage[dvipsnames]{xcolor} % for coloring text
\definecolor{primaryColor}{RGB}{0, 0, 0} % define primary color
\usepackage{enumitem} % for customizing lists
\usepackage{fontawesome5} % for using icons
\usepackage{amsmath} % for math
\usepackage[
    pdftitle={""" + escape_latex(data.get('header', {}).get('name', 'Resume')) + r"""'s CV},
    pdfauthor={""" + escape_latex(data.get('header', {}).get('name', '')) + r"""},
    pdfcreator={LaTeX with RenderCV},
    colorlinks=true,
    urlcolor=primaryColor
]{hyperref} % for links, metadata and bookmarks
\usepackage[pscoord]{eso-pic} % for floating text on the page
\usepackage{calc} % for calculating lengths
\usepackage{bookmark} % for bookmarks
\usepackage{lastpage} % for getting the total number of pages
\usepackage{changepage} % for one column entries (adjustwidth environment)
\usepackage{paracol} % for two and three column entries
\usepackage{ifthen} % for conditional statements
\usepackage{needspace} % for avoiding page brake right after the section title
\usepackage{iftex} % check if engine is pdflatex, xetex or luatex

% Ensure that generate pdf is machine readable/ATS parsable:
\ifPDFTeX
    \input{glyphtounicode}
    \pdfgentounicode=1
    \usepackage[T1]{fontenc}
    \usepackage[utf8]{inputenc}
    \usepackage{lmodern}
\fi

\usepackage{charter}

% Some settings:
\raggedright
\AtBeginEnvironment{adjustwidth}{\partopsep0pt} % remove space before adjustwidth environment
\pagestyle{empty} % no header or footer
\setcounter{secnumdepth}{0} % no section numbering
\setlength{\parindent}{0pt} % no indentation
\setlength{\topskip}{0pt} % no top skip
\setlength{\columnsep}{0.15cm} % set column seperation
\pagenumbering{gobble} % no page numbering

\titleformat{\section}{\needspace{4\baselineskip}\bfseries\large}{}{0pt}{}[\vspace{1pt}\titlerule]

\titlespacing{\section}{
    % left space:
    -1pt
}{
    % top space:
    0.3 cm
}{
    % bottom space:
    0.2 cm
} % section title spacing

\renewcommand\labelitemi{$\vcenter{\hbox{\small$\bullet$}}$} % custom bullet points
\newenvironment{highlights}{
    \begin{itemize}[
        topsep=0.10 cm,
        parsep=0.10 cm,
        partopsep=0pt,
        itemsep=0pt,
        leftmargin=0 cm + 10pt
    ]
}{
    \end{itemize}
} % new environment for highlights


\newenvironment{highlightsforbulletentries}{
    \begin{itemize}[
        topsep=0.10 cm,
        parsep=0.10 cm,
        partopsep=0pt,
        itemsep=0pt,
        leftmargin=10pt
    ]
}{
    \end{itemize}
} % new environment for highlights for bullet entries

\newenvironment{onecolentry}{
    \begin{adjustwidth}{
        0 cm + 0.00001 cm
    }{
        0 cm + 0.00001 cm
    }
}{
    \end{adjustwidth}
} % new environment for one column entries

\newenvironment{twocolentry}[2][]{
    \onecolentry
    \def\secondColumn{#2}
    \setcolumnwidth{\fill, 4.5 cm}
    \begin{paracol}{2}
}{
    \switchcolumn \raggedleft \secondColumn
    \end{paracol}
    \endonecolentry
} % new environment for two column entries

\newenvironment{threecolentry}[3][]{
    \onecolentry
    \def\thirdColumn{#3}
    \setcolumnwidth{, \fill, 4.5 cm}
    \begin{paracol}{3}
    {\raggedright #2} \switchcolumn
}{
    \switchcolumn \raggedleft \thirdColumn
    \end{paracol}
    \endonecolentry
} % new environment for three column entries

\newenvironment{header}{
    \setlength{\topsep}{0pt}\par\kern\topsep\centering\linespread{1.5}
}{
    \par\kern\topsep
} % new environment for the header

\newcommand{\placelastupdatedtext}{% \placetextbox{<horizontal pos>}{<vertical pos>}{<stuff>}
  \AddToShipoutPictureFG*{% Add <stuff> to current page foreground
    \put(
        \LenToUnit{\paperwidth-2 cm-0 cm+0.05cm},
        \LenToUnit{\paperheight-1.0 cm}
    ){\vtop{{\null}\makebox[0pt][c]{
        \small\color{gray}\textit{Last updated in September 2024}\hspace{\widthof{Last updated in September 2024}}
    }}}%
  }%
}%

% save the original href command in a new command:
\let\hrefWithoutArrow\href

% new command for external links:

\usepackage{anyfontsize}   % allows arbitrary font sizes

\AtBeginDocument{%
  \fontsize{11pt}{13.2pt}\selectfont
}

\begin{document}
    \newcommand{\AND}{\unskip
        \cleaders\copy\ANDbox\hskip\wd\ANDbox
        \ignorespaces
    }
    \newsavebox\ANDbox
    \sbox\ANDbox{$|$}""")

        # Generate header section
        header = data.get('header', {})
        if header:
            latex_content.append("\n    \\begin{header}")
            latex_content.append("        ")
            latex_content.append("    \\end{header}")
            latex_content.append("")
            latex_content.append("    \\begin{header}")
            latex_content.append(f"        \\fontsize{{25 pt}}{{25 pt}}\\selectfont {escape_latex(header.get('name', ''))}")
            latex_content.append("")
            latex_content.append("        \\normalsize")
            latex_content.append("        ")
            if header.get('tagline'):
                latex_content.append(f"        \\textit{{{escape_latex(header.get('tagline', ''))}}}")
            latex_content.append("        ")

            # Build contact line with separators
            contact_items = []
            if header.get('email'):
                contact_items.append(f"\\mbox{{\\hrefWithoutArrow{{mailto:{header.get('email')}}}{{{escape_latex(header.get('email', ''))}}}}}")
            if header.get('website'):
                # Remove http:// or https:// for display
                display_website = header.get('website', '').replace('https://', '').replace('http://', '').replace('www.', '')
                contact_items.append(f"\\mbox{{\\hrefWithoutArrow{{{header.get('website')}}}{{{escape_latex(display_website)}}}}}")
            if header.get('linkedin'):
                # Format LinkedIn URL for display
                linkedin_display = header.get('linkedin', '').replace('https://www.', '').replace('https://', '')
                contact_items.append(f"\\mbox{{\\hrefWithoutArrow{{{header.get('linkedin')}}}{{{escape_latex(linkedin_display)}}}}}")
            if header.get('github'):
                # Format GitHub URL for display
                github_display = header.get('github', '').replace('https://', '')
                contact_items.append(f"\\mbox{{\\hrefWithoutArrow{{{header.get('github')}}}{{{escape_latex(github_display)}}}}}")

            # Join contact items with AND separator
            if contact_items:
                contact_line = "%\n        \\kern 5.0 pt%\n        \\AND%\n        \\kern 5.0 pt%\n        ".join(contact_items)
                latex_content.append(f"        {contact_line}")

            latex_content.append("    \\end{header}")
            latex_content.append("")
            latex_content.append("    \\vspace{5 pt - 0.3 cm}")

        # Generate Education section
        education = data.get('education', {})
        if education:
            latex_content.append("")
            latex_content.append("\\section{Education}")

            # Date range
            dates = f"{education.get('startDate', '')} – {education.get('endDate', '')}"
            latex_content.append(f"        \\begin{{twocolentry}}{{")
            latex_content.append(f"            {escape_latex(dates)}")
            latex_content.append("        }")

            # University, Degree, Major
            uni_line = f"\\textbf{{{escape_latex(education.get('university', ''))}}}"
            if education.get('degree') or education.get('major'):
                degree_major = f", {education.get('degree', '')} in {education.get('major', '')}"
                uni_line += escape_latex(degree_major)

            latex_content.append(f"            {uni_line}\\end{{twocolentry}}")
            latex_content.append("")
            latex_content.append("        \\vspace{0.10 cm}")
            latex_content.append("        \\begin{onecolentry}")
            latex_content.append("            \\begin{highlights}")

            # GPA
            if education.get('gpa'):
                latex_content.append(f"                \\item GPA: \\textbf{{{escape_latex(str(education.get('gpa')))}}}/\\textbf{{4.0}}")

            # Coursework
            if education.get('coursework'):
                coursework_str = ", ".join(education.get('coursework', []))
                latex_content.append(f"                \\item \\textbf{{Coursework:}} {escape_latex(coursework_str)}")

            latex_content.append("            \\end{highlights}")
            latex_content.append("        \\end{onecolentry}")

        # Generate Experience section
        experience_list = data.get('experience', [])
        if experience_list:
            latex_content.append("")
            latex_content.append("\\section{Experience}")

            for i, exp in enumerate(experience_list):
                if i > 0:
                    latex_content.append("")
                    latex_content.append("    \\vspace{0.2 cm}")
                    latex_content.append("")

                # Date range
                dates = f"{exp.get('startDate', '')} – {exp.get('endDate', '')}"
                latex_content.append(f"    \\begin{{twocolentry}}{{")
                latex_content.append(f"        {escape_latex(dates)}")
                latex_content.append("    }")

                # Title and Position
                title_line = f"\\textbf{{{escape_latex(exp.get('title', ''))}}}"
                if exp.get('position'):
                    title_line += f" - {escape_latex(exp.get('position', ''))}"

                latex_content.append(f"        {title_line}\\end{{twocolentry}}")
                latex_content.append("")
                latex_content.append("    \\vspace{0.10 cm}")
                latex_content.append("    \\begin{onecolentry}")
                latex_content.append("        \\begin{highlights}")

                # Highlights
                for highlight in exp.get('highlights', []):
                    latex_content.append(f"            \\item {escape_latex(highlight)}")

                latex_content.append("        \\end{highlights}")
                latex_content.append("    \\end{onecolentry}")

        # Generate Projects section
        projects_list = data.get('projects', [])
        if projects_list:
            latex_content.append("")
            latex_content.append("\\section{Projects}")

            for i, project in enumerate(projects_list):
                if i > 0:
                    latex_content.append("")
                    latex_content.append("        \\vspace{0.2 cm}")
                    latex_content.append("")

                # Date
                latex_content.append(f"        \\begin{{twocolentry}}{{")
                latex_content.append(f"            {escape_latex(project.get('date', ''))}")
                latex_content.append("        }")

                # Title with optional link and awards
                title_parts = []
                project_title = escape_latex(project.get('title', ''))

                if project.get('link'):
                    title_parts.append(f"\\href{{{project.get('link')}}}{{\\textbf{{{project_title}}}}}")
                else:
                    title_parts.append(f"\\textbf{{{project_title}}}")

                # Add awards if present
                if project.get('awards'):
                    for award in project.get('awards', []):
                        title_parts.append(f" | \\textit{{{escape_latex(award)}}}")

                latex_content.append(f"            {''.join(title_parts)}\\end{{twocolentry}}")
                latex_content.append("        \\vspace{0.10 cm}")
                latex_content.append("        \\begin{onecolentry}")
                latex_content.append("            \\begin{highlights}")

                # Highlights
                for highlight in project.get('highlights', []):
                    latex_content.append(f"                \\item {escape_latex(highlight)}")

                latex_content.append("            \\end{highlights}")
                latex_content.append("        \\end{onecolentry}")

        # Generate Skills section
        skills = header.get('skills', {}) if header else {}
        if skills:
            latex_content.append("")
            latex_content.append("\\section{Skills}")
            latex_content.append("    \\begin{onecolentry}")

            # Define skill categories in order
            skill_categories = [
                ('Languages', 'languages'),
                ('Web Development', 'web_development'),
                ('AI/ML', 'ai_ml'),
                ('Cloud & Data', 'cloud_data'),
                ('Tools', 'tools')
            ]

            for category_name, category_key in skill_categories:
                if skills.get(category_key):
                    skill_list = ", ".join(skills[category_key])
                    latex_content.append(f"        \\textbf{{{category_name}:}} {escape_latex(skill_list)} \\\\")

            # Remove last \\ from the last line
            if latex_content[-1].endswith(" \\\\"):
                latex_content[-1] = latex_content[-1][:-3]

            latex_content.append("    \\end{onecolentry}")

        # Close document
        latex_content.append("")
        latex_content.append("\\end{document}")

        # Write to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(latex_content))

        print(f"LaTeX resume exported to {output_file}")
        return output_file

    except Exception as e:
        print(f"Error exporting LaTeX resume: {e}")
        return ""

if __name__ == "__main__":
    # Example usage
    print("Connecting to Convex and fetching resume data...")

    try:
        print_resume_summary()

        # Export to JSON - save to backend/data directory
        data_dir = "/Users/shawnpana/Documents/GitHub/bu-projects/resume-use/backend/data"
        os.makedirs(data_dir, exist_ok=True)
        json_path = os.path.join(data_dir, "resume_data.json")
        export_resume_to_json(json_path)

        # Export to LaTeX
        latex_path = os.path.join(data_dir, "resume.tex")
        export_to_latex(latex_path)

        # Get specific data
        projects = get_projects()
        print(f"\nFound {len(projects)} projects:")
        for project in projects[:3]:  # Show first 3
            print(f"- {project.get('title', 'Untitled')}")

    except Exception as e:
        print(f"Error: {e}")
        print("\nMake sure:")
        print("1. Your Convex development server is running")
        print("2. The .env file contains the correct VITE_CONVEX_URL")
        print("3. Your Convex functions are deployed and accessible")