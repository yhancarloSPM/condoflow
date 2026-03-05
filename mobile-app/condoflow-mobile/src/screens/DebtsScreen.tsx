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

export default function DebtsScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const filterStatus = route?.params?.filterStatus || null;

  useEffect(() => {
    loadDebts();
  }, []);

  useEffect(() => {
    // Recargar cuando cambie el filtro
    if (!loading) {
      loadDebts();
    }
  }, [filterStatus]);

  const loadDebts = async () => {
    try {
      if (user?.ownerId) {
        const data = await DebtService.getDebtsByOwner(user.ownerId);
        
        // Aplicar filtro si existe
        let filteredData = data;
        if (filterStatus) {
          if (filterStatus === 'pending') {
            filteredData = data.filter(d => d.status.toUpperCase() === 'PENDING');
          } else if (filterStatus === 'overdue') {
            filteredData = data.filter(d => d.status.toUpperCase() === 'OVERDUE');
          } else if (filterStatus === 'inReview') {
            filteredData = data.filter(d => d.status.toUpperCase() === 'PAYMENTSUBMITTED');
          } else if (filterStatus === 'paid') {
            filteredData = data.filter(d => d.status.toUpperCase() === 'PAID');
          }
        }
        
        setDebts(filteredData);
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
    const isInReview = item.status.toUpperCase() === 'PAYMENTSUBMITTED';
    const hasPartialPayment = item.amountPaid > 0 && item.remainingAmount > 0;
    const canPay = !isPaid && !isInReview;
    
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

        {canPay && (
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

  const getFilterTitle = () => {
    if (filterStatus === 'pending') return 'Deudas Pendientes';
    if (filterStatus === 'overdue') return 'Deudas Vencidas';
    if (filterStatus === 'inReview') return 'Deudas en Revisión';
    if (filterStatus === 'paid') return 'Deudas Pagadas';
    return 'Mis Deudas';
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
      {filterStatus && (
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>{getFilterTitle()}</Text>
        </View>
      )}
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
            <Text style={styles.emptyText}>
              {filterStatus 
                ? 'No hay deudas con este estado' 
                : 'No tienes deudas registradas'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  filterHeader: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
  },
  debtCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
  },
  debtMonth: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  debtBody: {
    marginBottom: 16,
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  debtLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  debtAmountUnpaid: {
    color: '#EF4444',
    fontSize: 20,
  },
  debtPaid: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
  },
  debtRemaining: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '700',
  },
  debtDate: {
    fontSize: 15,
    color: '#4b5563',
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
  },
});
