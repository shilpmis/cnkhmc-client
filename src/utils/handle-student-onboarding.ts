import type { Inquiry } from "@/services/InquiryServices";
import { toast } from "@/hooks/use-toast";
import type { Student } from "@/types/student";

/**
 * Handles the student onboarding process after successful form submission
 * @param studentData The created/updated student data
 * @param enrollmentId The enrollment ID generated for the student
 * @param inquiry The original inquiry data
 * @param updateInquiry Function to update the inquiry status
 * @param refetch Function to refresh the inquiries list
 * @param closeDialog Function to close the dialog
 */
export const handleStudentOnboarding = async (
  studentData: Student,
  // enrollmentId: string,
  inquiry: Inquiry,
  updateInquiry: any,
  refetch: () => void,
  closeDialog: () => void
) => {
  try {
    // Update the inquiry with the enrollment ID and change status to enrolled
    await updateInquiry({
      id: inquiry.id,
      status: "enrolled",
      // enrollment_id:enrollmentId,
    }).unwrap();

    toast({
      title: "Student Onboarded Successfully",
      description: `Student has been successfully onboarded`,
    });

    // Close the dialog and refresh the inquiries list
    closeDialog();
    refetch();

    return true;
  } catch (error: any) {
    console.error("Error updating inquiry status:", error);

    toast({
      title: "Error",
      description: "Failed to update inquiry status. Please try again.",
      variant: "destructive",
    });

    return false;
  }
};
