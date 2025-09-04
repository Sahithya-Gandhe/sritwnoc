import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import NocPdfGenerator from './nocpdf.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import './NocGenerator.css';

// Import react-to-pdf as a fallback
import { usePDF } from 'react-to-pdf';

const NocGenerator = () => {
  const pdfRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const { studentData } = location.state || {};

  // Initialize react-to-pdf as fallback
  const { toPDF: reactToPDF, targetRef: reactToPDFRef } = usePDF({
    filename: 'NOC_Document.pdf',
    page: { margin: 20 }
  });

  const [studentName, setStudentName] = useState(studentData?.studentName || '');
  const [rollNo, setRollNo] = useState(studentData?.rollNo || '');
  const [branch, setBranch] = useState(studentData?.branch || '');
  const [year, setYear] = useState(studentData?.year || '');

  useEffect(() => {
    if (studentData) {
      setStudentName(studentData.studentName || '');
      setRollNo(studentData.rollNo || '');
      setBranch(studentData.branch || '');
      setYear(studentData.year || '');
    }
  }, [studentData]);

  const handleDownloadPdf = useCallback(async () => {
    const element = pdfRef.current;
    if (!element) {
      console.error('Error: PDF target element not found.');
      alert('Failed to generate PDF: Content not ready.');
      return;
    }

    try {
      // Multiple fallback strategies for html2pdf
      let html2pdf;
      
      // Strategy 1: Try dynamic import with different approaches
      try {
        const module = await import('html2pdf.js');
        html2pdf = module.default || module;
      } catch (importError1) {
        console.log('Strategy 1 failed:', importError1.message);
        
        // Strategy 2: Try accessing from window
        try {
          html2pdf = window.html2pdf;
          if (!html2pdf) throw new Error('Not found on window');
        } catch (importError2) {
          console.log('Strategy 2 failed:', importError2.message);
          
          // Strategy 3: Try require (for compatibility)
          try {
            html2pdf = require('html2pdf.js');
          } catch (importError3) {
            console.log('Strategy 3 failed:', importError3.message);
            
            // Strategy 4: Use react-to-pdf as fallback
            console.log('Falling back to react-to-pdf...');
            try {
              if (reactToPDFRef && reactToPDF) {
                // Set the ref for react-to-pdf to use the same element
                reactToPDFRef.current = element;
                await reactToPDF();
                console.log('PDF generated successfully using react-to-pdf!');
                return; // Exit the function successfully
              }
            } catch (reactToPdfError) {
              console.log('react-to-pdf fallback failed:', reactToPdfError.message);
            }
            
            throw new Error('All PDF generation methods failed. Please check if pdf libraries are properly installed.');
          }
        }
      }
      
      // Ensure html2pdf is a function
      if (typeof html2pdf !== 'function') {
        throw new Error('html2pdf is not a function. Library may not be properly loaded.');
      }
      
      const opt = {
        margin: 0.5,
        filename: `NOC_${studentName.replace(/ /g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };

      console.log('Attempting to generate PDF with html2pdf...');
      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      console.log('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Provide more helpful error message with fallback suggestion
      const errorMessage = error.message.includes('html2pdf') 
        ? 'PDF generation failed. The html2pdf library could not be loaded. Please try refreshing the page or contact support.'
        : `Failed to generate PDF: ${error.message}`;
        
      alert(errorMessage);
      
      // Optional: Implement a fallback method using browser print
      if (confirm('PDF generation failed. Would you like to use the browser\'s print function to save as PDF instead?')) {
        // Create a print-friendly version
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>NOC - ${studentName}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${element.innerHTML}
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      }
    }
  }, [studentName]);

  return (
    <div className="noc-generator-container">
      <div className="noc-generator-header">
        <h2>Generate NOC</h2>
        <button onClick={() => navigate(-1)} className="close-button">Close</button>
      </div>
      <div className="noc-form-fields">
        <label>
          Student Name:
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter Student Name"
          />
        </label>
        <label>
          Roll Number:
          <input
            type="text"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            placeholder="Enter Roll Number"
          />
        </label>
        <label>
          Branch:
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            <option value="">Select Branch</option>
            <option value="CSE">CSE</option>
            <option value="CSD">CSD</option>
            <option value="CSM">CSM</option>
            <option value="CSC">CSC</option>
            <option value="ECE">ECE</option>
          </select>
        </label>
        <label>
          Year:
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">Select Year</option>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </label>
      </div>
      <button onClick={handleDownloadPdf} className="download-pdf-button">
        Download PDF (html2pdf)
      </button>
      
      <button 
        onClick={() => {
          try {
            if (reactToPDFRef && reactToPDF) {
              reactToPDFRef.current = pdfRef.current;
              reactToPDF();
            } else {
              alert('React-to-PDF not available');
            }
          } catch (error) {
            console.error('React-to-PDF error:', error);
            alert('Failed to generate PDF with react-to-pdf');
          }
        }} 
        className="download-pdf-button" 
        style={{ marginLeft: '10px', backgroundColor: '#10b981' }}
      >
        Download PDF (Alternative)
      </button>

      <div style={{ position: 'absolute', left: '-9999px' }}>
        <NocPdfGenerator ref={pdfRef} studentName={studentName} rollNo={rollNo} branch={branch} year={year} />
      </div>
    </div>
  );
};

export default NocGenerator;