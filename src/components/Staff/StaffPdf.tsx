
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";


// Register fonts (optional but recommended for better styling)
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlfBBc9.ttf",
      fontWeight: "bold",
    },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333333",
  },
  profileSection: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  staffName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  staffId: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
    padding: 5,
    color: "#333333",
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: "40%",
    fontSize: 10,
    color: "#666666",
  },
  value: {
    width: "60%",
    fontSize: 10,
    fontWeight: "bold",
  },
  columns: {
    flexDirection: "row",
    marginBottom: 10,
  },
  column: {
    width: "50%",
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#CCCCCC",
    paddingTop: 10,
    fontSize: 8,
    color: "#999999",
    textAlign: "center",
  },
});


const StaffDetailsPDF = ({ staff }:any) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* School Header */}
        <View style={styles.header}>
                <Image src={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSe7Ba2aq-TTW-H_ieh4nDoE_23MZ1qs0TOxg&s"} style={{ width: 130, height: 100 }} />
          <View style={{ marginLeft: 7}}>
            <Text style={styles.title}>Pragti Gujrat Goverment School</Text>
            <Text style={{fontSize: 10, fontWeight: 8}}>Address : 123 Education Lane, Knowledge City, KC 12345</Text>
          </View>
        </View>

        {/* Staff Profile Header */}
        <View style={styles.profileSection}>
          <Image src={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrmvSoqEMvs4E-TIgyfMdztZYEdKav-zok1A&s"} style={{ width: 130, height: 100 }}/>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.staffName}>{staff.first_name} {staff.middle_name} {staff.last_name}</Text>
            <Text style={styles.staffId}>Id: {staff.id} | Subject: {staff.subject_specialization}</Text>
          </View>
        </View>

        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name in Gujarati:</Text>
            <Text style={styles.value}>{staff.first_name_in_guj}</Text>
            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>{staff.gender}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date of Birth:</Text>
            <Text style={styles.value}>{staff.birth_date}</Text>
            <Text style={styles.label}>Place:</Text>
            <Text style={styles.value}>{staff.city}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Aadhar Number:</Text>
            <Text style={styles.value}>{staff.aadhar_no}</Text>
            <Text style={styles.label}>Adhar Dise No:</Text>
            <Text style={styles.value}>{null}</Text>
          </View>
        </View>

        {/*Contact Details  */}
        <View style={styles.columns}>
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Details</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Mobile No:</Text>
                <Text style={styles.value}>{staff.mobile_number}</Text>
                <Text style={styles.label}>Email::</Text>
                <Text style={styles.value}>{staff.email}</Text>
              </View>
            </View>
          </View>

          {/* Other Information */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Other Information</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Religion:</Text>
                <Text style={styles.value}>{staff.religion}</Text>
                <Text style={styles.label}>Religion(Guj):</Text>
                <Text style={styles.value}>{staff.religion_in_guj}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Caste:</Text>
                <Text style={styles.value}>{staff.caste}</Text>
                <Text style={styles.label}>Caste(Guj):</Text>
                <Text style={styles.value}>{staff.caste_in_guj}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Category:</Text>
                <Text style={styles.value}>{staff.category}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Address Information  */}
        <View style={styles.columns}>
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address Information</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{staff.address}</Text>
                <Text style={styles.label}>District:</Text>
                <Text style={styles.value}>{staff.district}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>City:</Text>
                <Text style={styles.value}>{staff.city}</Text>
                <Text style={styles.label}>Postal Code:</Text>
                <Text style={styles.value}>{staff.state}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>State:</Text>
                <Text style={styles.value}>{staff.state}</Text>
              </View>
            </View>
          </View>

          {/* bank Details */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bank Details</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Bank Name:</Text>
                <Text style={styles.value}>{staff.bank_name}</Text>
                <Text style={styles.label}>Account Name:</Text>
                <Text style={styles.value}>{staff.account_no}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>IFSC Code:</Text>
                <Text style={styles.value}>{staff.IFSC_code}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Employment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Joining Date:</Text>
            <Text style={styles.value}>{staff.joining_date}</Text>
            <Text style={styles.label}>Employment Status:</Text>
            <Text style={styles.value}>{staff.employment_status}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This document was generated on {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default StaffDetailsPDF;