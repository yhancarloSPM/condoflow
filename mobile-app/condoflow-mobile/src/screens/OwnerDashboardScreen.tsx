import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryStack } from 'victory';
import { useAuth } from '../context/AuthContext';
import { ApartmentService } from '../services/apartment.service';
import { DebtService } from '../services/debt.service';

const screenWidth = Dimensions.get('window').width;

interface DashboardStats {
  maintenanceAmount: number;
  requirePaymentCount: number;
  requirePaymentAmount: number;
  inReviewCount: number;
  inReviewAmount: number;
  paidCount: number;
  paidAmount: number;
  overdueCount: number;
  overdueAmount: number;
}

interface YearlyStats {
  pendingCount: number;
  overdueCount: number;
  inReviewCount: number;
  paidCount: number;
}

export default function OwnerDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<DashboardStats>({
    maintenanceAmount: 0,
    requirePaymentCount: 0,
    requirePaymentAmount: 0,
    inReviewCount: 0,
    inReviewAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
  });
  const [yearlyStats, setYearlyStats] = useState<YearlyStats>({
    pendingCount: 0,
    overdueCount: 0,
    inReviewCount: 0,
    paidCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allDebts, setAllDebts] = useState<any[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Solo recalcular si no es la carga inicial y hay deudas
    if (!isInitialLoad && allDebts.length > 0) {
      calculateYearlyStats();
    }
  }, [selectedYear]);

  const calculateYearlyStats = () => {
    // Filtrar deudas por año seleccionado usando la propiedad 'year' del backend
    const debts = allDebts.filter(debt => debt.year === selectedYear);
    
    // Calcular estadísticas por estado para el año seleccionado
    const pendingDebts = debts.filter(d => d.status === 'Pending');
    const overdueDebts = debts.filter(d => d.status === 'Overdue');
    const inReviewDebts = debts.filter(d => d.status === 'PaymentSubmitted');
    const paidDebts = debts.filter(d => d.status === 'Paid');

    const newStats = {
      pendingCount: pendingDebts.length,
      overdueCount: overdueDebts.length,
      inReviewCount: inReviewDebts.length,
      paidCount: paidDebts.length,
    };

    setYearlyStats(newStats);
    
    // Calcular datos mensuales para el gráfico de barras
    const monthlyData = calculateMonthlyData(debts);
    setMonthlyChartData(monthlyData);
  };

  const calculateMonthlyData = (debts: any[]) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyStats = months.map((month, index) => {
      const monthDebts = debts.filter(debt => {
        const debtMonth = new Date(debt.dueDate).getMonth();
        return debtMonth === index;
      });
      
      const paid = monthDebts.filter(d => d.status === 'Paid').length;
      const inReview = monthDebts.filter(d => d.status === 'PaymentSubmitted').length;
      const overdue = monthDebts.filter(d => d.status === 'Overdue').length;
      const pending = monthDebts.filter(d => d.status === 'Pending').length;
      
      return {
        month,
        paid,
        inReview,
        overdue,
        pending
      };
    });
    
    return monthlyStats;
  };

  const loadDashboardData = async () => {
    try {
      if (!user?.ownerId) {
        return;
      }

      // Cargar datos del apartamento
      let maintenanceAmount = 0;
      if (user?.apartmentId) {
        const apartmentData = await ApartmentService.getApartmentById(user.apartmentId);
        maintenanceAmount = apartmentData.monthlyMaintenanceAmount || 0;
      }

      // Cargar todas las deudas (sin filtrar por año)
      const debts = await DebtService.getDebtsByOwner(user.ownerId);
      
      // Extraer años únicos de las deudas usando la propiedad 'year' del backend
      const years = [...new Set(debts.map(debt => debt.year))].filter(y => y != null).sort((a, b) => b - a);
      setAvailableYears(years);
      
      // Si hay años disponibles, establecer el año seleccionado al más reciente
      if (years.length > 0) {
        const currentYear = years[0];
        setSelectedYear(currentYear);
        
        // Calcular estadísticas del año inmediatamente con las deudas cargadas
        const yearDebts = debts.filter(debt => debt.year === currentYear);
        
        const pendingDebts = yearDebts.filter(d => d.status === 'Pending');
        const overdueDebts = yearDebts.filter(d => d.status === 'Overdue');
        const inReviewDebts = yearDebts.filter(d => d.status === 'PaymentSubmitted');
        const paidDebts = yearDebts.filter(d => d.status === 'Paid');

        setYearlyStats({
          pendingCount: pendingDebts.length,
          overdueCount: overdueDebts.length,
          inReviewCount: inReviewDebts.length,
          paidCount: paidDebts.length,
        });
        
        // Calcular datos mensuales
        const monthlyData = calculateMonthlyData(yearDebts);
        setMonthlyChartData(monthlyData);
      }
      
      // Guardar todas las deudas para el filtro
      setAllDebts(debts);
      
      // Marcar que la carga inicial está completa
      setIsInitialLoad(false);
      
      // Calcular estadísticas generales (todos los años)
      const requirePaymentDebts = debts.filter(d => d.status === 'Pending');
      const requirePaymentAmount = requirePaymentDebts.reduce((sum, d) => sum + d.amount, 0);
      
      const overdueDebts = debts.filter(d => d.status === 'Overdue');
      const overdueAmount = overdueDebts.reduce((sum, d) => sum + d.amount, 0);
      
      const inReviewDebts = debts.filter(d => d.status === 'PaymentSubmitted');
      const inReviewAmount = inReviewDebts.reduce((sum, d) => sum + d.amount, 0);
      
      const paidDebts = debts.filter(d => d.status === 'Paid');
      const paidAmount = paidDebts.reduce((sum, d) => sum + d.amount, 0);

      setStats({
        maintenanceAmount,
        requirePaymentCount: requirePaymentDebts.length,
        requirePaymentAmount,
        inReviewCount: inReviewDebts.length,
        inReviewAmount,
        paidCount: paidDebts.length,
        paidAmount,
        overdueCount: overdueDebts.length,
        overdueAmount,
      });
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1e40af']} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Resumen de tu actividad</Text>
      </View>

      {/* Filtro de Año */}
      {availableYears.length > 0 && (
        <View style={styles.yearFilterContainer}>
          <View style={styles.yearFilterHeader}>
            <Text style={styles.yearFilterIcon}>📅</Text>
            <Text style={styles.yearFilterLabel}>Año</Text>
          </View>
          <Picker
            selectedValue={selectedYear}
            onValueChange={(itemValue) => setSelectedYear(Number(itemValue))}
            style={styles.picker}
            dropdownIconColor="#1e40af"
            itemStyle={styles.pickerItem}
          >
            {availableYears.map((year) => (
              <Picker.Item key={year} label={year.toString()} value={year} />
            ))}
          </Picker>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {/* Tarjeta de Pendientes */}
          <TouchableOpacity 
            style={[styles.statCard, styles.statCardHalf, { borderLeftColor: '#F59E0B' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Queries', { 
              screen: 'DebtsMenu',
              params: { filterStatus: 'pending' }
            })}
          >
            <Text style={styles.statLabel}>Pendientes</Text>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats.requirePaymentCount}
            </Text>
            <Text style={styles.statSubtext}>
              {formatCurrency(stats.requirePaymentAmount)}
            </Text>
          </TouchableOpacity>

          {/* Tarjeta de Vencidos */}
          <TouchableOpacity 
            style={[styles.statCard, styles.statCardHalf, { borderLeftColor: '#EF4444' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Queries', { 
              screen: 'DebtsMenu',
              params: { filterStatus: 'overdue' }
            })}
          >
            <Text style={styles.statLabel}>Vencidos</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>
              {stats.overdueCount}
            </Text>
            <Text style={styles.statSubtext}>
              {formatCurrency(stats.overdueAmount)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {/* Tarjeta de En Revisión */}
          <TouchableOpacity 
            style={[styles.statCard, styles.statCardHalf, { borderLeftColor: '#f97316' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Queries', { 
              screen: 'DebtsMenu',
              params: { filterStatus: 'inReview' }
            })}
          >
            <Text style={styles.statLabel}>En Revisión</Text>
            <Text style={[styles.statValue, { color: '#f97316' }]}>
              {stats.inReviewCount}
            </Text>
            <Text style={styles.statSubtext}>
              {formatCurrency(stats.inReviewAmount)}
            </Text>
          </TouchableOpacity>

          {/* Tarjeta de Pagados */}
          <TouchableOpacity 
            style={[styles.statCard, styles.statCardHalf, { borderLeftColor: '#10B981' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Queries', { 
              screen: 'DebtsMenu',
              params: { filterStatus: 'paid' }
            })}
          >
            <Text style={styles.statLabel}>Pagados</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {stats.paidCount}
            </Text>
            <Text style={styles.statSubtext}>
              {formatCurrency(stats.paidAmount)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gráfico de Pastel - Estado de Deudas */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Estado de Mis Deudas {selectedYear}</Text>
        <View style={styles.chartContainer}>
          <VictoryPie
            key={`pie-chart-${selectedYear}-${yearlyStats.pendingCount}-${yearlyStats.overdueCount}-${yearlyStats.inReviewCount}-${yearlyStats.paidCount}`}
            data={[
              ...(yearlyStats.pendingCount > 0 ? [{ x: 'Pendientes', y: yearlyStats.pendingCount, fill: '#F59E0B' }] : []),
              ...(yearlyStats.overdueCount > 0 ? [{ x: 'Vencidos', y: yearlyStats.overdueCount, fill: '#EF4444' }] : []),
              ...(yearlyStats.inReviewCount > 0 ? [{ x: 'En Revisión', y: yearlyStats.inReviewCount, fill: '#f97316' }] : []),
              ...(yearlyStats.paidCount > 0 ? [{ x: 'Pagados', y: yearlyStats.paidCount, fill: '#10B981' }] : []),
            ].length > 0 ? [
              ...(yearlyStats.pendingCount > 0 ? [{ x: 'Pendientes', y: yearlyStats.pendingCount, fill: '#F59E0B' }] : []),
              ...(yearlyStats.overdueCount > 0 ? [{ x: 'Vencidos', y: yearlyStats.overdueCount, fill: '#EF4444' }] : []),
              ...(yearlyStats.inReviewCount > 0 ? [{ x: 'En Revisión', y: yearlyStats.inReviewCount, fill: '#f97316' }] : []),
              ...(yearlyStats.paidCount > 0 ? [{ x: 'Pagados', y: yearlyStats.paidCount, fill: '#10B981' }] : []),
            ] : [{ x: 'Sin datos', y: 1, fill: '#9ca3af' }]}
            width={screenWidth - 64}
            height={250}
            padding={{ top: 20, bottom: 20, left: 20, right: 20 }}
            style={{
              labels: { fontSize: 0 },
              data: { fill: ({ datum }) => datum.fill }
            }}
            labelRadius={({ innerRadius }) => (innerRadius as number) + 30}
            animate={{
              duration: 500,
              onLoad: { duration: 500 }
            }}
          />
          
          {/* Leyenda personalizada */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Pendientes</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Vencidos</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#f97316' }]} />
              <Text style={styles.legendText}>En Revisión</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Pagados</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Gráfico de Barras - Cumplimiento Mensual */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Estado de Cumplimiento Mensual</Text>
        <View style={styles.chartContainer} key={`bar-${selectedYear}`}>
          <VictoryChart
            width={screenWidth - 32}
            height={300}
            domainPadding={{ x: 8 }}
            padding={{ top: 20, bottom: 50, left: 100, right: 20 }}
            domain={{ y: [0, 4] }}
          >
            <VictoryAxis
              style={{
                axis: { stroke: '#e5e7eb' },
                tickLabels: { fontSize: 10, fill: '#6b7280' }
              }}
            />
            <VictoryAxis
              dependentAxis
              tickValues={[0.5, 1, 2, 3]}
              tickFormat={['Pendiente', 'Vencido', 'En Revisión', 'Pagado']}
              style={{
                axis: { stroke: 'transparent' },
                tickLabels: { 
                  fontSize: 11, 
                  fill: '#1f2937', 
                  fontWeight: '600',
                  padding: 5 
                },
                grid: { stroke: '#e5e7eb', strokeWidth: 0.5 }
              }}
            />
            <VictoryBar
              data={monthlyChartData.map(d => ({ 
                x: d.month, 
                y: d.paid > 0 ? 3 : 0
              }))}
              style={{
                data: { fill: '#10B981' }
              }}
              barWidth={12}
            />
            <VictoryBar
              data={monthlyChartData.map(d => ({ 
                x: d.month, 
                y: d.inReview > 0 ? 2 : 0
              }))}
              style={{
                data: { fill: '#f97316' }
              }}
              barWidth={12}
            />
            <VictoryBar
              data={monthlyChartData.map(d => ({ 
                x: d.month, 
                y: d.overdue > 0 ? 1 : 0
              }))}
              style={{
                data: { fill: '#EF4444' }
              }}
              barWidth={12}
            />
            <VictoryBar
              data={monthlyChartData.map(d => ({ 
                x: d.month, 
                y: d.pending > 0 ? 0.5 : 0
              }))}
              style={{
                data: { fill: '#F59E0B' }
              }}
              barWidth={12}
            />
          </VictoryChart>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingTop: 32,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
  },
  statCardHalf: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  statValueSmall: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chartSection: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  yearFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  yearFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearFilterIcon: {
    fontSize: 20,
  },
  yearFilterLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  picker: {
    width: 120,
    height: 40,
    color: '#1f2937',
    fontWeight: '600',
  },
  pickerItem: {
    fontSize: 15,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 20,
    rowGap: 12,
    columnGap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
});
