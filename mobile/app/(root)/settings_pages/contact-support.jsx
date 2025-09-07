import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "../../Constant_Design";

export default function ContactSupport() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);

  const [subjectError, setSubjectError] = useState("");
  const [messageError, setMessageError] = useState("");

  const [modalVisible, setModalVisible] = useState(false);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.type === "success") {
        setAttachment(result);
      }
    } catch (err) {
      console.log("File pick error:", err);
    }
  };

  const handleSend = () => {
    let valid = true;

    // Validate subject
    if (subject.trim().length < 5 || subject.trim().length > 15) {
      setSubjectError("Subject must be 5–15 characters.");
      valid = false;
    } else {
      setSubjectError("");
    }

    // Validate message
    if (!message.trim()) {
      setMessageError("Message cannot be empty.");
      valid = false;
    } else {
      setMessageError("");
    }

    if (valid) {
      setModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Image
          source={require("../../../assets/images/back_icon.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>Contact Support</Text>

      {/* Subject */}
      <Text style={styles.label}>Subject:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter the subject of your concern."
        value={subject}
        onChangeText={setSubject}
        maxLength={15}
      />
      {subjectError ? <Text style={styles.error}>{subjectError}</Text> : null}

      {/* Message */}
      <Text style={styles.label}>Message:</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Describe your issue here."
        value={message}
        onChangeText={setMessage}
        multiline
      />
      {messageError ? <Text style={styles.error}>{messageError}</Text> : null}

      {/* Attachment */}
      <Text style={styles.label}>Attachment:</Text>
      <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
        <Text style={styles.uploadText}>📎 Upload File</Text>
      </TouchableOpacity>
      {attachment && (
        <Text style={styles.attachmentText}>Attached: {attachment.name}</Text>
      )}

      {/* Send */}
      <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>

      {/* Success Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Thank you for contacting support!</Text>
            <Text style={styles.modalContent}>
              We appreciate your help in improving our service.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setModalVisible(false);
                router.push("/(root)/settings"); // placeholder redirect
              }}
            >
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  backBtn: {
    position: "absolute",
    top: 50,
    left: 0,
    padding: 10,
    zIndex: 1,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 50,
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  textarea: {
    height: 100,
    textAlignVertical: "top",
  },
  error: {
    color: "red",
    marginTop: 4,
    fontSize: 12,
  },
  uploadBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 5,
    alignSelf: "flex-start",
  },
  uploadText: {
    color: "#fff",
    fontWeight: "600",
  },
  attachmentText: {
    fontSize: 12,
    color: "#555",
    marginTop: 5,
  },
  sendBtn: {
    marginTop: 40,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  sendText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  modalContent: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
