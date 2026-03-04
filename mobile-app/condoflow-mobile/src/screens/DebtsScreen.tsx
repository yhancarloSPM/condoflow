import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DebtService } from '../services/debt.service';
import { Debt } from '../types';

export default function DebtsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      console.log('User data:', user);
      console.log('Owner ID:', user?.ownerId);
      
      if (user?.ownerId) {
        const data = await DebtService.getDebtsByOwner(user.ownerId);
        console.log('Debts loaded:', data);
        setDebts(data);
      } else {
        console.log('No ownerId found');
      }
    } catch (error) {
      console.error('Error loading debts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDebts();
  }, []);

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return '#F59E0B'; // Naranja - igual que la web
      case 'PAID':
        return '#10B981'; // Verde - igual que la web
      case 'OVERDUE':
        return '#EF4444'; // Rojo - igual que la web
      case 'PAYMENTSUBMITTED':
        return '#f97316'; // Naranja oscuro - igual que la web
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'Pendiente';
      case 'PAID':
        return 'Pagada';
      case 'OVERDUE':
        return 'Vencida';
      case 'PAYMENTSUBMITTED':
        return 'En Revisión';
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
      month: 'long',
      day: 'numeric',
    });
  };

  const renderDebtItem = ({ item }: { item: Debt }) => {
    const isPaid = item.status.toUpperCase() === 'PAID';
    const hasPartialPayment = item.amountPaid > 0 && item.remainingAmount > 0;
    
    return (
      <TouchableOpacity
        style={styles.debtCard}
        onPress={() => navigation.navigate('DebtDetail', { debt: item })}
      >
        <View style={styles.debtHeader}>
          <Text style={styles.debtMonth}>
            {new Date(2024, item.month - 1).toLocaleDateString('es-DO', {
              month: 'long',
            })}{' '}
            {item.year}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.debtBody}>
          <View style={styles.debtRow}>
            <Text style={styles.debtLabel}>Monto:</Text>
            <Text style={[
              styles.debtAmount,
              !isPaid && styles.debtAmountUnpaid
            ]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>

          {hasPartialPayment && (
            <>
              <View style={styles.debtRow}>
                <Text style={styles.debtLabel}>Pagado:</Text>
                <Text style={styles.debtPaid}>
                  {formatCurrency(item.amountPaid)}
                </Text>
              </View>
              <View style={styles.debtRow}>
                <Text style={styles.debtLabel}>Por Pagar:</Text>
                <Text style={styles.debtRemaining}>
                  {formatCurrency(item.remainingAmount)}
                </Text>
              </View>
            </>
          )}

          <View style={styles.debtRow}>
            <Text style={styles.debtLabel}>Vencimiento:</Text>
            <Text style={styles.debtDate}>{formatDate(item.dueDate)}</Text>
          </View>
        </View>

        {!isPaid && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() =>
              navigation.navigate('CreatePayment', { debtId: item.id })
            }
          >
            <Text style={styles.payButtonText}>Pagar</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

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
        data={debts}
        renderItem={renderDebtItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tienes deudas registradas</Text>
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
  debtCard: {
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
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  debtMonth: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textTransform: 'capitalize',
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
  debtBody: {
    marginBottom: 15,
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  debtLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  debtAmountUnpaid: {
    color: '#EF4444', // Rojo para deudas no pagadas
  },
  debtPaid: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  debtRemaining: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
  },
  debtDate: {
    fontSize: 14,
    color: '#34495e',
  },
  payButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
