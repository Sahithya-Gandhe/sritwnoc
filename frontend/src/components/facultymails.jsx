import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseconfig";

// Separate variables for each faculty role
export let examBranchEmail = "";
export let libraryEmail = "";
// export let accountsEmail = "";
export let tnpEmail = "";
export let ieeeEmail = "";
export let sportsEmail = "";
export let alumniEmail = "";

// Function to fetch all faculty emails and assign to variables
export async function fetchAllFacultyEmails() {
  try {
    const facultyRef = collection(db, "faculty");
    const querySnapshot = await getDocs(facultyRef);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Document ID: ${doc.id}, Data:`, data);
      switch (data.roll) {
        case "Examination Branch":
          if (data.email) examBranchEmail = data.email;
          break;
        case "Library":
          if (data.email) libraryEmail = data.email;
          break;
        // case "Accounts":
        //   accountsEmail = data.email;
        //   break;
        case "Training & Placement Cell":
          if (data.email) tnpEmail = data.email;
          break;
        case "IEEE / ISTE / CSI":
          if (data.email) ieeeEmail = data.email;
          break;
        case "Sports / Games":
          if (data.email) sportsEmail = data.email;
          break;
        // case "Mentor": // Removed mentorEmail as it's now handled by student input
        //   if (data.email) mentorEmail = data.email;
        //   break;
        case "Alumni Association":
          if (data.email) alumniEmail = data.email;
          break;
        default:
          console.warn(`Unknown role in faculty collection: ${data.roll} for document ID: ${doc.id}`);
      }
    });

    console.log("Faculty emails fetched successfully:", {
      examBranchEmail,
      libraryEmail,
    //   accountsEmail,
      tnpEmail,
      ieeeEmail,
      sportsEmail,
      alumniEmail,
    });
  } catch (error) {
    console.error("Error fetching faculty emails:", error);
  }
}
