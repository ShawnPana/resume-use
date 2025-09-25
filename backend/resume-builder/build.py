import subprocess
import os
from pdflatex import PDFLaTeX

os.chdir(os.path.dirname(__file__))
# subprocess.run(['pdflatex', '-interaction=nonstopmode', '../data/resume.tex'])

pdfl = PDFLaTeX.from_texfile('../data/resume.tex')
pdf, log, completed_process = pdfl.create_pdf(keep_pdf_file=True, keep_log_file=True)