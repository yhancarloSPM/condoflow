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
  const { debtId } = route.params || {};
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
    if (!debtId) {
      Alert.alert('Error', 'No se ha seleccionado una deuda. Por favor selecciona una deuda desde la pantalla de Mis Deudas.');
      return;
    }

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
            'Pago registrado exitosamente. Tu pago está en revisión y será procesado por el administrador.',
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
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    color: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  imagePickerButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePickerText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  imageContainer: {
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
