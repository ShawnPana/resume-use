import os
import json
from typing import Dict, List, Optional
from dotenv import load_dotenv
from convex import ConvexClient

# Load environment variables from .env.local file in parent directory
env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env.local")
load_dotenv(env_path)

# Initialize Convex client
CONVEX_URL = os.getenv("VITE_CONVEX_URL")
if not CONVEX_URL:
    raise ValueError("VITE_CONVEX_URL environment variable is not set")

client = ConvexClient(CONVEX_URL)

def get_header() -> Dict:
    """
    Get header information from Convex

    Returns:
        Dict containing header info or empty dict if none found
    """
    try:
        result = client.query("resumeFunctions:getHeader")
        return result if result else {}
    except Exception as e:
        print(f"Error fetching header: {e}")
        return {}

def get_education() -> Dict:
    """
    Get education information from Convex

    Returns:
        Dict containing education info or empty dict if none found
    """
    try:
        result = client.query("resumeFunctions:getEducation")
        return result if result else {}
    except Exception as e:
        print(f"Error fetching education: {e}")
        return {}

def get_experience() -> List[Dict]:
    """
    Get all experience entries from Convex

    Returns:
        List of experience dictionaries
    """
    try:
        result = client.query("resumeFunctions:getExperience")
        return result if result else []
    except Exception as e:
        print(f"Error fetching experience: {e}")
        return []

def get_projects() -> List[Dict]:
    """
    Get all project entries from Convex

    Returns:
        List of project dictionaries
    """
    try:
        result = client.query("resumeFunctions:getProjects")
        return result if result else []
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return []

def get_full_resume() -> Dict:
    """
    Get complete resume data from Convex

    Returns:
        Dict containing all resume sections
    """
    return {
        "header": get_header(),
        "education": get_education(),
        "experience": get_experience(),
        "projects": get_projects()
    }

def get_filtered_resume(selected_experience_ids: Optional[List[str]] = None,
                       selected_project_ids: Optional[List[str]] = None) -> Dict:
    """
    Get resume data with optional filtering for experiences and projects

    Args:
        selected_experience_ids: List of experience IDs to include (None = all)
        selected_project_ids: List of project IDs to include (None = all)

    Returns:
        Dict containing filtered resume data
    """
    data = get_full_resume()

    # Filter experiences if IDs provided
    if selected_experience_ids is not None:
        all_experiences = data.get('experience', [])
        data['experience'] = [
            exp for exp in all_experiences
            if exp.get('_id') in selected_experience_ids
        ]

    # Filter projects if IDs provided
    if selected_project_ids is not None:
        all_projects = data.get('projects', [])
        data['projects'] = [
            proj for proj in all_projects
            if proj.get('_id') in selected_project_ids
        ]

    return data

def export_resume_to_json(filename: str = "resume_data.json",
                         selected_experience_ids: Optional[List[str]] = None,
                         selected_project_ids: Optional[List[str]] = None) -> str:
    """
    Export resume data to JSON file with optional filtering

    Args:
        filename: Output JSON file path
        selected_experience_ids: List of experience IDs to include
        selected_project_ids: List of project IDs to include

    Returns:
        Path to the created file
    """
    resume_data = get_filtered_resume(selected_experience_ids, selected_project_ids)

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
        print(f"Error printing summary: {e}")

def ensure_url_protocol(url: str) -> str:
    """
    Ensure URL has https:// protocol if no protocol is specified

    Args:
        url: URL string that may or may not have protocol

    Returns:
        URL with https:// protocol
    """
    if not url:
        return url

    # If URL already has a protocol (http:// or https://), return as is
    if url.startswith('http://') or url.startswith('https://'):
        return url

    # Add https:// if no protocol present
    return f'https://{url}'

def escape_latex(text: str) -> str:
    """
    Escape special LaTeX characters in text

    Args:
        text: Text to escape

    Returns:
        LaTeX-safe text
    """
    if not text:
        return ""

    # Process backslash FIRST to avoid double-escaping
    result = text.replace('\\', '<<<BACKSLASH>>>')

    # Then escape other special characters
    result = result.replace('&', r'\&')
    result = result.replace('%', r'\%')
    result = result.replace('$', r'\$')
    result = result.replace('#', r'\#')
    result = result.replace('_', r'\_')
    result = result.replace('{', r'\{')
    result = result.replace('}', r'\}')
    result = result.replace('~', r'\textasciitilde{}')
    result = result.replace('^', r'\textasciicircum{}')

    # Finally replace backslash placeholder with proper LaTeX command
    result = result.replace('<<<BACKSLASH>>>', r'\textbackslash{}')

    return result

def export_to_latex(output_file: str = "resume.tex",
                   selected_experience_ids: Optional[List[str]] = None,
                   selected_project_ids: Optional[List[str]] = None,
                   settings: Optional[Dict] = None) -> str:
    """
    Export resume data to a complete LaTeX document with optional filtering

    Args:
        output_file: Output LaTeX file path
        selected_experience_ids: List of experience IDs to include
        selected_project_ids: List of project IDs to include
        settings: Dictionary of settings for LaTeX generation

    Returns:
        Path to the created file
    """
    try:
        data = get_filtered_resume(selected_experience_ids, selected_project_ids)

        # Extract settings with defaults
        if settings is None:
            settings = {}

        font_size = settings.get('fontSize', 11)
        margins = settings.get('margins', 1.0)
        line_spacing = settings.get('lineSpacing', 1.0)
        compact_mode = settings.get('compactMode', False)

        # Apply line spacing and compact mode settings
        if compact_mode:
            top_space = "0.15 cm"
            bottom_space = "0.1 cm"
            item_spacing = "0.03 cm"
        else:
            top_space = f"{0.3 * line_spacing} cm"
            bottom_space = f"{0.2 * line_spacing} cm"
            item_spacing = f"{0.05 * line_spacing} cm"

        # Build the LaTeX document
        latex_lines = []

        # Document class and packages
        latex_lines.append(f"\\documentclass[{font_size}pt, letterpaper]{{article}}")
        latex_lines.append("")
        latex_lines.append("% Packages:")
        latex_lines.append("\\usepackage[")
        latex_lines.append("    ignoreheadfoot, % set margins without considering header and footer")
        latex_lines.append(f"    top={margins} cm, % seperation between body and page edge from the top")
        latex_lines.append(f"    bottom={margins * 0.5} cm, % seperation between body and page edge from the bottom")
        latex_lines.append(f"    left={margins * 0.5} cm, % seperation between body and page edge from the left")
        latex_lines.append(f"    right={margins * 0.5} cm, % seperation between body and page edge from the right")
        latex_lines.append(f"    footskip={margins} cm, % seperation between body and footer")
        latex_lines.append("    % showframe % for debugging")
        latex_lines.append("]{geometry} % for adjusting page geometry")
        latex_lines.append("\\usepackage{titlesec} % for customizing section titles")
        latex_lines.append("\\usepackage{tabularx} % for making tables with fixed width columns")
        latex_lines.append("\\usepackage{array} % tabularx requires this")
        latex_lines.append("\\usepackage[dvipsnames]{xcolor} % for coloring text")
        latex_lines.append("\\definecolor{primaryColor}{RGB}{0, 0, 0} % define primary color")
        latex_lines.append("\\usepackage{enumitem} % for customizing lists")
        latex_lines.append("\\usepackage{fontawesome5} % for using icons")
        latex_lines.append("\\usepackage{amsmath} % for math")
        latex_lines.append("\\usepackage[")
        latex_lines.append(f"    pdftitle={{{escape_latex(data.get('header', {}).get('name', 'Resume'))}'s CV}},")
        latex_lines.append(f"    pdfauthor={{{escape_latex(data.get('header', {}).get('name', ''))}}},")
        latex_lines.append("    pdfcreator={LaTeX with RenderCV},")
        latex_lines.append("    colorlinks=true,")
        latex_lines.append("    urlcolor=primaryColor")
        latex_lines.append("]{hyperref} % for links, metadata and bookmarks")
        latex_lines.append("\\usepackage[pscoord]{eso-pic} % for floating text on the page")
        latex_lines.append("\\usepackage{calc} % for calculating lengths")
        latex_lines.append("\\usepackage{bookmark} % for bookmarks")
        latex_lines.append("\\usepackage{lastpage} % for getting the total number of pages")
        latex_lines.append("\\usepackage{changepage} % for one column entries (adjustwidth environment)")
        latex_lines.append("\\usepackage{paracol} % for two and three column entries")
        latex_lines.append("\\usepackage{ifthen} % for conditional statements")
        latex_lines.append("\\usepackage{needspace} % for avoiding page brake right after the section title")
        latex_lines.append("\\usepackage{iftex} % check if engine is pdflatex, xetex or luatex")
        latex_lines.append("")
        latex_lines.append("% Ensure that generate pdf is machine readable/ATS parsable:")
        latex_lines.append("\\ifPDFTeX")
        latex_lines.append("    \\input{glyphtounicode}")
        latex_lines.append("    \\pdfgentounicode=1")
        latex_lines.append("    \\usepackage[T1]{fontenc}")
        latex_lines.append("    \\usepackage[utf8]{inputenc}")
        latex_lines.append("    \\usepackage{lmodern}")
        latex_lines.append("\\fi")
        latex_lines.append("")
        latex_lines.append("\\usepackage{charter}")
        latex_lines.append("")
        latex_lines.append("% Some settings:")
        latex_lines.append("\\raggedright")
        latex_lines.append("\\AtBeginEnvironment{adjustwidth}{\\partopsep0pt} % remove space before adjustwidth environment")
        latex_lines.append("\\pagestyle{empty} % no header or footer")
        latex_lines.append("\\setcounter{secnumdepth}{0} % no section numbering")
        latex_lines.append("\\setlength{\\parindent}{0pt} % no indentation")
        latex_lines.append("\\setlength{\\topskip}{0pt} % no top skip")
        latex_lines.append("\\setlength{\\columnsep}{0.15cm} % set column seperation")
        latex_lines.append("\\pagenumbering{gobble} % no page numbering")
        latex_lines.append("")
        # Scale section title size based on document font size
        section_size = "\\large" if font_size >= 11 else "\\normalsize" if font_size == 10 else "\\large"
        latex_lines.append(f"\\titleformat{{\\section}}{{\\needspace{{4\\baselineskip}}\\bfseries{section_size}}}{{}}{{0pt}}{{}}[\\vspace{{1pt}}\\titlerule]")
        latex_lines.append("")
        latex_lines.append("\\titlespacing{\\section}{")
        latex_lines.append("    % left space:")
        latex_lines.append("    -1pt")
        latex_lines.append("}{")
        latex_lines.append("    % top space:")
        latex_lines.append(f"    {top_space}")
        latex_lines.append("}{")
        latex_lines.append("    % bottom space:")
        latex_lines.append(f"    {bottom_space}")
        latex_lines.append("} % section title spacing")
        latex_lines.append("")
        latex_lines.append("")
        latex_lines.append("\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\small$\\bullet$}}$} % custom bullet points")
        latex_lines.append("\\newenvironment{highlights}{")
        latex_lines.append("    \\begin{itemize}[")
        latex_lines.append(f"        topsep={item_spacing},")
        latex_lines.append(f"        parsep={item_spacing},")
        latex_lines.append("        partopsep=0pt,")
        latex_lines.append("        itemsep=0pt,")
        latex_lines.append("        leftmargin=10pt")
        latex_lines.append("    ]")
        latex_lines.append("}{")
        latex_lines.append("    \\end{itemize}")
        latex_lines.append("} % new environment for highlights for bullet entries")
        latex_lines.append("")
        latex_lines.append("\\newenvironment{onecolentry}{")
        latex_lines.append("    \\begin{adjustwidth}{")
        latex_lines.append("        0 cm + 0.00001 cm")
        latex_lines.append("    }{")
        latex_lines.append("        0 cm + 0.00001 cm")
        latex_lines.append("    }")
        latex_lines.append("}{")
        latex_lines.append("    \\end{adjustwidth}")
        latex_lines.append("} % new environment for one column entries")
        latex_lines.append("")
        latex_lines.append("\\newenvironment{twocolentry}[2][]{")
        latex_lines.append("    \\onecolentry")
        latex_lines.append("    \\def\\secondColumn{#2}")
        latex_lines.append("    \\setcolumnwidth{\\fill, 4.5 cm}")
        latex_lines.append("    \\begin{paracol}{2}")
        latex_lines.append("}{")
        latex_lines.append("    \\switchcolumn \\raggedleft \\secondColumn")
        latex_lines.append("    \\end{paracol}")
        latex_lines.append("    \\endonecolentry")
        latex_lines.append("} % new environment for two column entries")
        latex_lines.append("")
        latex_lines.append("\\newenvironment{threecolentry}[3][]{")
        latex_lines.append("    \\onecolentry")
        latex_lines.append("    \\def\\secondColumn{#2}")
        latex_lines.append("    \\def\\thirdColumn{#3}")
        latex_lines.append("    \\setcolumnwidth{\\fill, 4.5 cm, 4.5 cm}")
        latex_lines.append("    \\begin{paracol}{3}")
        latex_lines.append("}{")
        latex_lines.append("    \\switchcolumn \\raggedleft \\secondColumn \\switchcolumn \\raggedleft \\thirdColumn")
        latex_lines.append("    \\end{paracol}")
        latex_lines.append("    \\endonecolentry")
        latex_lines.append("} % new environment for three column entries")
        latex_lines.append("")
        latex_lines.append("\\newenvironment{header}{")
        latex_lines.append("    \\setlength{\\topsep}{0pt}\\par\\kern\\topsep\\centering\\linespread{1.5}")
        latex_lines.append("}{")
        latex_lines.append("    \\par\\kern\\topsep")
        latex_lines.append("} % new environment for the header")
        latex_lines.append("")
        latex_lines.append("\\newcommand{\\placelastupdatedtext}{% \\placetextbox{<horizontal pos>}{<vertical pos>}{<stuff>}")
        latex_lines.append("  \\AddToShipoutPictureFG*{% Add <stuff> to current page foreground")
        latex_lines.append("    \\put(")
        latex_lines.append("        \\LenToUnit{\\paperwidth-2 cm-0 cm+0.05cm},")
        latex_lines.append("        \\LenToUnit{\\paperheight-1.0 cm}")
        latex_lines.append("    ){\\vtop{{\\null}\\makebox[0pt][c]{")
        latex_lines.append("        \\small\\color{gray}\\textit{Last updated in September 2024}\\hspace{\\widthof{Last updated in September 2024}}")
        latex_lines.append("    }}}%")
        latex_lines.append("  }%")
        latex_lines.append("}%")
        latex_lines.append("")
        latex_lines.append("% save the original href command in a new command:")
        latex_lines.append("\\let\\hrefWithoutArrow\\href")
        latex_lines.append("")
        latex_lines.append("% new command for external links:")
        latex_lines.append("")
        latex_lines.append("\\usepackage{anyfontsize}   % allows arbitrary font sizes")
        latex_lines.append("")
        latex_lines.append("\\AtBeginDocument{%")
        latex_lines.append(f"  \\fontsize{{{font_size}pt}}{{{font_size * 1.2}pt}}\\selectfont")
        latex_lines.append("}")
        latex_lines.append("")
        latex_lines.append("\\begin{document}")
        latex_lines.append("    \\newcommand{\\AND}{\\unskip")
        latex_lines.append("        \\cleaders\\copy\\ANDbox\\hskip\\wd\\ANDbox")
        latex_lines.append("        \\ignorespaces")
        latex_lines.append("    }")
        latex_lines.append("    \\newsavebox\\ANDbox")
        latex_lines.append("    \\sbox\\ANDbox{$|$}")

        # Generate header section
        header = data.get('header', {})
        if header:
            latex_lines.append("")
            latex_lines.append("    \\begin{header}")
            # Scale header name size proportionally to document font size
            header_size = 25 if font_size == 11 else 23 if font_size == 10 else 27
            latex_lines.append(f"        \\fontsize{{{header_size} pt}}{{{header_size} pt}}\\selectfont {escape_latex(header.get('name', ''))}")
            latex_lines.append("")
            latex_lines.append("        \\normalsize")
            latex_lines.append("        ")
            if header.get('tagline'):
                latex_lines.append(f"        \\textit{{{escape_latex(header.get('tagline', ''))}}}")
            latex_lines.append("        ")

            # Build contact line with separators
            contact_items = []
            if header.get('email'):
                contact_items.append(f"\\mbox{{\\hrefWithoutArrow{{mailto:{header.get('email')}}}{{{escape_latex(header.get('email', ''))}}}}}")
            if header.get('website'):
                # Ensure URL has protocol and remove for display
                full_url = ensure_url_protocol(header.get('website', ''))
                display_website = header.get('website', '').replace('https://', '').replace('http://', '').replace('www.', '')
                contact_items.append(f"\\mbox{{\\hrefWithoutArrow{{{full_url}}}{{{escape_latex(display_website)}}}}}")
            if header.get('linkedin'):
                # Ensure URL has protocol and format for display
                full_url = ensure_url_protocol(header.get('linkedin', ''))
                linkedin_display = header.get('linkedin', '').replace('https://www.', '').replace('https://', '')
                contact_items.append(f"\\mbox{{\\hrefWithoutArrow{{{full_url}}}{{{escape_latex(linkedin_display)}}}}}")
            if header.get('github'):
                # Ensure URL has protocol and format for display
                full_url = ensure_url_protocol(header.get('github', ''))
                github_display = header.get('github', '').replace('https://', '')
                contact_items.append(f"\\mbox{{\\hrefWithoutArrow{{{full_url}}}{{{escape_latex(github_display)}}}}}")

            # Join contact items with AND separator
            if contact_items:
                contact_line = "%\n        \\kern 5.0 pt%\n        \\AND%\n        \\kern 5.0 pt%\n        ".join(contact_items)
                latex_lines.append(f"        {contact_line}")

            latex_lines.append("    \\end{header}")
            latex_lines.append("")
            latex_lines.append("    \\vspace{5 pt - 0.3 cm}")

        # Generate Education section
        education = data.get('education', {})
        if education:
            latex_lines.append("")
            latex_lines.append("\\section{Education}")

            # Date range
            dates = f"{education.get('startDate', '')} – {education.get('endDate', '')}"
            latex_lines.append(f"        \\begin{{twocolentry}}{{")
            latex_lines.append(f"            {escape_latex(dates)}")
            latex_lines.append("        }")

            # University and degree
            uni_line = f"            \\textbf{{{escape_latex(education.get('university', ''))}}}"
            if education.get('degree') and education.get('major'):
                uni_line += f" -- {escape_latex(education.get('degree', ''))} in {escape_latex(education.get('major', ''))}"
            elif education.get('degree'):
                uni_line += f" -- {escape_latex(education.get('degree', ''))}"
            latex_lines.append(f"{uni_line}\\end{{twocolentry}}")

            # GPA (not indented, at same level as university)
            if education.get('gpa'):
                latex_lines.append("")
                latex_lines.append(f"        GPA: \\textbf{{{escape_latex(str(education.get('gpa')))}}}/\\textbf{{4.0}}")

            # Coursework
            if education.get('coursework'):
                latex_lines.append("")
                latex_lines.append("        \\vspace{0.10 cm}")
                latex_lines.append("        \\begin{onecolentry}")
                latex_lines.append("            \\begin{highlights}")
                coursework_str = ', '.join(education['coursework'])
                latex_lines.append(f"                \\item \\textbf{{Coursework:}} {escape_latex(coursework_str)}")
                latex_lines.append("            \\end{highlights}")
                latex_lines.append("        \\end{onecolentry}")

        # Generate Experience section
        experiences = data.get('experience', [])
        if experiences:
            latex_lines.append("")
            latex_lines.append("\\section{Experience}")
            for i, exp in enumerate(experiences):
                if i > 0:
                    latex_lines.append("")
                    latex_lines.append("    \\vspace{0.2 cm}")
                    latex_lines.append("")

                # Date range
                dates = f"{exp.get('startDate', '')} – {exp.get('endDate', '')}"
                latex_lines.append(f"    \\begin{{twocolentry}}{{")
                latex_lines.append(f"        {escape_latex(dates)}")
                latex_lines.append("    }")

                # Position, company, and location (in schema: position=role, title=company, location=location)
                title_parts = []
                if exp.get('position'):
                    title_parts.append(escape_latex(exp.get('position', '')))
                if exp.get('title'):
                    title_parts.append(escape_latex(exp.get('title', '')))
                if exp.get('location'):
                    title_parts.append(escape_latex(exp.get('location', '')))

                if title_parts:
                    title_line = f"        \\textbf{{{' \\textbar\\ '.join(title_parts)}}}"
                else:
                    title_line = "        \\textbf{}"
                latex_lines.append(f"{title_line}\\end{{twocolentry}}")
                latex_lines.append("")
                latex_lines.append("    \\vspace{0.10 cm}")
                latex_lines.append("    \\begin{onecolentry}")
                latex_lines.append("        \\begin{highlights}")

                # Process description - split by periods for bullet points
                if exp.get('description'):
                    # Split by period and filter empty strings
                    bullets = [b.strip() for b in exp['description'].split('.') if b.strip()]
                    for bullet in bullets:
                        latex_lines.append(f"            \\item {escape_latex(bullet)}")

                # Also include highlights if present
                if exp.get('highlights'):
                    for highlight in exp['highlights']:
                        latex_lines.append(f"            \\item {escape_latex(highlight)}")

                latex_lines.append("        \\end{highlights}")
                latex_lines.append("    \\end{onecolentry}")

        # Generate Projects section
        projects = data.get('projects', [])
        if projects:
            latex_lines.append("")
            latex_lines.append("\\section{Projects}")
            for i, project in enumerate(projects):
                if i > 0:
                    latex_lines.append("")
                    latex_lines.append("        \\vspace{0.2 cm}")
                    latex_lines.append("")

                latex_lines.append(f"        \\begin{{twocolentry}}{{")
                latex_lines.append(f"            {escape_latex(project.get('date', ''))}")
                latex_lines.append("        }")

                # Build title with event and awards
                title_parts = [f"            \\textbf{{{escape_latex(project.get('title', ''))}}}"]
                if project.get('event'):
                    title_parts.append(f" \\textbar\\ {escape_latex(project.get('event', ''))}")
                if project.get('award'):
                    # Handle award as either string or list
                    award = project.get('award')
                    if isinstance(award, list):
                        award_str = ', '.join(award)
                    else:
                        award_str = str(award) if award else ''
                    if award_str:
                        title_parts.append(f" \\textbar\\ {escape_latex(award_str)}")
                if project.get('technologies'):
                    tech_str = ', '.join(project['technologies'])
                    title_parts.append(f" \\textbar\\ {escape_latex(tech_str)}")
                if project.get('link'):
                    # Ensure URL has protocol and extract display text
                    full_url = ensure_url_protocol(project['link'])
                    display_link = project['link'].replace('https://', '').replace('http://', '').replace('www.', '')
                    if display_link.endswith('/'):
                        display_link = display_link[:-1]
                    title_parts.append(f" \\textbar\\ \\mbox{{\\hrefWithoutArrow{{{full_url}}}{{{escape_latex(display_link)}}}}}")

                latex_lines.append(f"{''.join(title_parts)}\\end{{twocolentry}}")
                latex_lines.append("        \\vspace{0.10 cm}")
                latex_lines.append("        \\begin{onecolentry}")
                latex_lines.append("            \\begin{highlights}")

                # Process highlights
                if project.get('highlights'):
                    for highlight in project['highlights']:
                        latex_lines.append(f"                \\item {escape_latex(highlight)}")

                # Process description - split by periods for bullet points
                if project.get('description'):
                    bullets = [b.strip() for b in project['description'].split('.') if b.strip()]
                    for bullet in bullets:
                        latex_lines.append(f"                \\item {escape_latex(bullet)}")

                latex_lines.append("            \\end{highlights}")
                latex_lines.append("        \\end{onecolentry}")

        # Generate Skills section
        if header.get('skills'):
            latex_lines.append("")
            latex_lines.append("\\section{Skills}")
            latex_lines.append("    \\begin{onecolentry}")

            skills = header['skills']
            skill_lines = []

            for category, skill_list in skills.items():
                if skill_list:
                    # Format category name
                    formatted_category = category.title()
                    skills_str = ', '.join(skill_list)
                    line = f"        \\textbf{{{escape_latex(formatted_category)}:}} {escape_latex(skills_str)}"
                    skill_lines.append(line)

            # Add lines with proper separation
            for i, line in enumerate(skill_lines):
                if i < len(skill_lines) - 1:
                    latex_lines.append(line + " \\\\")
                else:
                    latex_lines.append(line)

            latex_lines.append("    \\end{onecolentry}")

        # Close document
        latex_lines.append("")
        latex_lines.append("\\end{document}")

        # Write to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(latex_lines))

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