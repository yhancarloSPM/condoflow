import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { PaymentService } from '../services/payment.service';

export default function CreatePaymentScreen({ route, navigation }: any) {
  const { debtId } = route.params;
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permiso Requerido',
        'Se necesita permiso para acceder a la galería'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptImage(result.assets[0].uri);
      setReceiptFileName(
        result.assets[0].fileName || `receipt_${Date.now()}.jpg`
      );
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permiso Requerido',
        'Se necesita permiso para acceder a la cámara'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptImage(result.assets[0].uri);
      setReceiptFileName(`receipt_${Date.now()}.jpg`);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Por favor ingrese un monto válido');
      return;
    }

    if (!receiptImage) {
      Alert.alert('Error', 'Por favor adjunte el comprobante de pago');
      return;
    }

    setLoading(true);
    try {
      // Convert image to base64
      const response = await fetch(receiptImage);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64String = base64data.split(',')[1];

        try {
          await PaymentService.createPayment(user.ownerId, {
            debtId,
            amount: parseFloat(amount),
            paymentDate,
            receiptBase64: base64String,
            receiptFileName,
          });

          Alert.alert(
            'Éxito',
            'Pago registrado exitosamente. Espera la aprobación del administrador.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } catch (error: any) {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'Error al registrar el pago'
          );
        } finally {
          setLoading(false);
        }
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert('Error', 'Error al procesar la imagen');
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Registrar Pago</Text>

        <Text style={styles.label}>Monto (RD$)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!loading}
        />

        <Text style={styles.label}>Fecha de Pago</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={paymentDate}
          onChangeText={setPaymentDate}
          editable={!loading}
        />

        <Text style={styles.label}>Comprobante de Pago</Text>

        {receiptImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: receiptImage }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setReceiptImage(null)}
            >
              <Text style={styles.removeButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePickerContainer}>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
              disabled={loading}
            >
              <Text style={styles.imagePickerText}>📁 Galería</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={takePhoto}
              disabled={loading}
            >
              <Text style={styles.imagePickerText}>📷 Cámara</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Registrar Pago</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imagePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imagePickerButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 10,
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
