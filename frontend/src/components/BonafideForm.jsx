import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseconfig';
import { collection, addDoc } from 'firebase/firestore';
import './BonafideForm.css';

const BonafideForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    rollNo: '',
    studentName: '',
    year: '',
    branch: '',
    fatherName: '',
    academicYear: '',
    course: '',
    adminNo: '',
    conduct: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.rollNo || !formData.studentName || !formData.year || !formData.branch) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'bonafideRequests'), {
        ...formData,
        status: 'Generated', // Automatically mark as generated
        timestamp: new Date()
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting bonafide request:', error);
      alert('Error submitting bonafide request: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success message after submission
  if (isSubmitted) {
    return (
      <div className="bonafide-container">
        <div className="bonafide-header">
          <h2>Bonafide Certificate Request</h2>
        </div>
        <div className="success-message">
          <h3>Request Submitted Successfully!</h3>
          <p><strong>Your Bonafide request has been submitted.</strong></p>
          <p>Please collect your Bonafide certificate from the admin office.</p>
          <p>Thank you!</p>
          <div style={{ marginTop: '30px' }}>
            <button
              onClick={() => navigate('/student-dashboard')}
              className="btn btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form UI
  return (
    <div className="bonafide-container">
      <div className="bonafide-header">
        <h2>Bonafide Certificate Request Form</h2>
      </div>

      <form onSubmit={handleSubmit} className="bonafide-form">
        {/* Roll No */}
        <div className="form-group">
          <label htmlFor="rollNo">Roll Number:</label>
          <input
            type="text"
            id="rollNo"
            name="rollNo"
            value={formData.rollNo}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        {/* Name */}
        <div className="form-group">
          <label htmlFor="studentName">Name:</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        {/* Father’s Name */}
        <div className="form-group">
          <label htmlFor="fatherName">Father's Name:</label>
          <input
            type="text"
            id="fatherName"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        {/* Year */}
        <div className="form-group">
          <label htmlFor="year">Year:</label>
          <select
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="">Select Year</option>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </div>

        {/* Branch */}
        <div className="form-group">
          <label htmlFor="branch">Branch:</label>
          <select
            id="branch"
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="">Select Branch</option>
            <option value="CSE">CSE</option>
            <option value="CSD">CSD</option>
            <option value="CSM">CSM</option>
            <option value="CSC">CSC</option>
            <option value="ECE">ECE</option>
          </select>
        </div>

        {/* Academic Year */}
        <div className="form-group">
          <label htmlFor="academicYear">Academic Year:</label>
          <input
            type="text"
            id="academicYear"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleChange}
            className="form-control"
            placeholder="e.g. 2024-2025"
          />
        </div>

        {/* Course */}
        <div className="form-group">
          <label htmlFor="course">Course:</label>
          <input
            type="text"
            id="course"
            name="course"
            value={formData.course}
            onChange={handleChange}
            className="form-control"
            placeholder="e.g. B.Tech"
          />
        </div>

        {/* Admission No */}
        <div className="form-group">
          <label htmlFor="adminNo">Admission Number:</label>
          <input
            type="text"
            id="adminNo"
            name="adminNo"
            value={formData.adminNo}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        {/* Conduct */}
        <div className="form-group">
          <label htmlFor="conduct">Conduct:</label>
          <select
            id="conduct"
            name="conduct"
            value={formData.conduct}
            onChange={handleChange}
            className="form-control"
          >
            <option value="">Select Conduct</option>
            <option value="Good">Good</option>
            <option value="Very Good">Very Good</option>
            <option value="Excellent">Excellent</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="submit-section">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/student-dashboard')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BonafideForm;
