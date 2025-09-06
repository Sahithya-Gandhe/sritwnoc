import React, { useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import BonafidePdf from './BonafidePdf';
import './Noc.css';

const BonafideGenerator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const componentRef = useRef();
  const studentData = location.state?.studentData;

  // Handle printing
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Bonafide_${studentData?.rollNo || 'certificate'}`,
  });

  // Redirect if no student data
  useEffect(() => {
    if (!studentData) {
      alert('No student data provided');
      navigate('/admin-dashboard');
    }
  }, [studentData, navigate]);

  if (!studentData) {
    return null;
  }

  return (
    <div className="page">
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2>Bonafide Certificate Preview</h2>
        <p>Review the certificate details below and click "Print Certificate" when ready.</p>
        
        <div style={{ margin: '20px 0' }}>
          <button 
            onClick={handlePrint}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Print Certificate
          </button>
          
          <button 
            onClick={() => navigate('/admin-dashboard')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>

      {/* Preview the certificate */}
      <BonafidePdf 
        ref={componentRef}
        studentName={studentData.studentName}
        rollNo={studentData.rollNo}
        branch={studentData.branch}
        year={studentData.year}
      />
    </div>
  );
};

export default BonafideGenerator;