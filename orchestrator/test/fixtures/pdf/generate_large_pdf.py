#!/usr/bin/env python3
"""
Générateur de PDF large pour tests de performance
Crée un PDF de 50 pages avec du texte répété
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import os

def generate_large_pdf(output_path: str, num_pages: int = 50):
    """Génère un PDF avec plusieurs pages pour tests de performance"""
    
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    
    for page_num in range(1, num_pages + 1):
        # Titre de page
        c.setFont("Helvetica-Bold", 16)
        c.drawString(72, height - 72, f"Page {page_num} - Test PDF Bridge Performance")
        
        # Contenu répété
        c.setFont("Helvetica", 12)
        y_position = height - 120
        
        # Paragraphe répété 15 fois par page
        for para in range(15):
            text_lines = [
                f"Paragraph {para + 1}: This is a test document with multiple pages",
                "designed to test the PDF Bridge performance and pagination limits.",
                "Each page contains repeated text to simulate real-world documents.",
                f"Current position: Page {page_num}, Paragraph {para + 1}",
                "This content helps validate extraction speed and memory usage."
            ]
            
            for line in text_lines:
                if y_position > 72:  # Marge de bas
                    c.drawString(72, y_position, line)
                    y_position -= 20
                else:
                    break
        
        # Numéro de page en bas
        c.setFont("Helvetica", 10)
        c.drawString(width - 100, 50, f"Page {page_num}/{num_pages}")
        
        c.showPage()
    
    c.save()
    print(f"✅ Generated large PDF: {output_path} ({num_pages} pages)")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, "large.pdf")
    
    try:
        generate_large_pdf(output_path)
    except ImportError as e:
        print(f"⚠️  ReportLab not installed. Creating placeholder file.")
        print(f"   Install with: pip install reportlab")
        
        # Créer un fichier placeholder
        with open(output_path, 'w') as f:
            f.write("# PLACEHOLDER: Run generate_large_pdf.py with reportlab installed\n")
            f.write("# This should be a 50-page PDF for performance testing\n")
