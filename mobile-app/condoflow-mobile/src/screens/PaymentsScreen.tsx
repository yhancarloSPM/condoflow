import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { PaymentService } from '../services/payment.service';
import { Payment } from '../types';

export default function PaymentsScreen() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      if (user?.ownerId) {
        const data = await PaymentService.getPaymentsByOwner(user.ownerId);
        setPayments(data);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPayments();
  }, []);

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return '#F59E0B'; // Naranja
      case 'APPROVED':
        return '#10B981'; // Verde
      case 'REJECTED':
        return '#EF4444'; // Rojo
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'Pendiente';
      case 'APPROVED':
        return 'Aprobado';
      case 'REJECTED':
        return 'Rechazado';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.paymentBody}>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Fecha de Pago:</Text>
          <Text style={styles.paymentValue}>
            {formatDate(item.paymentDate)}
          </Text>
        </View>

        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Registrado:</Text>
          <Text style={styles.paymentValue}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.approvedAt && (
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Aprobado:</Text>
            <Text style={styles.paymentValue}>
              {formatDate(item.approvedAt)}
            </Text>
          </View>
        )}

        {item.rejectedAt && (
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Rechazado:</Text>
            <Text style={styles.paymentValue}>
              {formatDate(item.rejectedAt)}
            </Text>
          </View>
        )}

        {item.rejectionReason && (
          <View style={styles.rejectionContainer}>
            <Text style={styles.rejectionLabel}>Motivo de Rechazo:</Text>
            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
          </View>
        )}
      </View>

      {item.receiptUrl && (
        <TouchableOpacity style={styles.receiptButton}>
          <Text style={styles.receiptButtonText}>Ver Comprobante</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tienes pagos registrados</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Mismo color que la web
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  paymentBody: {
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  paymentValue: {
    fontSize: 14,
    color: '#34495e',
    fontWeight: '500',
  },
  rejectionContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  rejectionLabel: {
    fontSize: 12,
    color: '#c0392b',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#e74c3c',
  },
  receiptButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  receiptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
  },
});
