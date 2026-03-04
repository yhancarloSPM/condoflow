import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
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
}

interface YearlyStats {
  requirePaymentCount: number;
  inReviewCount: number;
  paidCount: number;
}

export default function OwnerDashboardScreen() {
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
  });
  const [yearlyStats, setYearlyStats] = useState<YearlyStats>({
    requirePaymentCount: 0,
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
    const requirePaymentDebts = debts.filter(d => d.status === 'Pending' || d.status === 'Overdue');
    const inReviewDebts = debts.filter(d => d.status === 'PaymentSubmitted');
    const paidDebts = debts.filter(d => d.status === 'Paid');

    const newStats = {
      requirePaymentCount: requirePaymentDebts.length,
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
      const requirePayment = monthDebts.filter(d => d.status === 'Pending' || d.status === 'Overdue').length;
      
      return {
        month,
        paid,
        inReview,
        requirePayment
      };
    });
    
    return monthlyStats;
  };

  const loadDashboardData = async () => {
    try {
      if (!user?.ownerId) {
        console.log('No ownerId found');
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
        
        const requirePaymentDebts = yearDebts.filter(d => d.status === 'Pending' || d.status === 'Overdue');
        const inReviewDebts = yearDebts.filter(d => d.status === 'PaymentSubmitted');
        const paidDebts = yearDebts.filter(d => d.status === 'Paid');

        setYearlyStats({
          requirePaymentCount: requirePaymentDebts.length,
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
      const requirePaymentDebts = debts.filter(d => d.status === 'Pending' || d.status === 'Overdue');
      const requirePaymentAmount = requirePaymentDebts.reduce((sum, d) => sum + d.amount, 0);
      
      const inReviewDebts = debts.filter(d => d.status === 'PaymentSubmitted');
      const inReviewAmount = inReviewDebts.reduce((sum, d) => sum + d.amount, 0);
      
      const paidDebts = debts.filter(d => d.status === 'Paid');
      const paidAmount = paidDebts.reduce((sum, d) => sum + d.amount, 0);
      
      const overdueDebts = debts.filter(d => d.status === 'Overdue');

      setStats({
        maintenanceAmount,
        requirePaymentCount: requirePaymentDebts.length,
        requirePaymentAmount,
        inReviewCount: inReviewDebts.length,
        inReviewAmount,
        paidCount: paidDebts.length,
        paidAmount,
        overdueCount: overdueDebts.length,
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
          <Text style={styles.yearFilterLabel}>Filtrar por año:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedYear}
              onValueChange={(itemValue) => setSelectedYear(Number(itemValue))}
              style={styles.picker}
              dropdownIconColor="#6b7280"
            >
              {availableYears.map((year) => (
                <Picker.Item key={year} label={year.toString()} value={year} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      <View style={styles.statsContainer}>
        {/* Tarjeta de Pago Mensual */}
        <View style={[styles.statCard, { borderLeftColor: '#6366f1' }]}>
          <Text style={styles.statLabel}>Pago Mensual</Text>
          <Text style={[styles.statValue, { color: '#6366f1' }]}>
            {formatCurrency(stats.maintenanceAmount)}
          </Text>
          <Text style={styles.statSubtext}>Mantenimiento</Text>
        </View>

        {/* Tarjeta de Requieren Pago */}
        <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
          <Text style={styles.statLabel}>Requieren Pago</Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            {stats.requirePaymentCount}
          </Text>
          <Text style={styles.statSubtext}>
            {formatCurrency(stats.requirePaymentAmount)}
          </Text>
        </View>

        {/* Tarjeta de En Revisión */}
        <View style={[styles.statCard, { borderLeftColor: '#f97316' }]}>
          <Text style={styles.statLabel}>En Revisión</Text>
          <Text style={[styles.statValue, { color: '#f97316' }]}>
            {stats.inReviewCount}
          </Text>
          <Text style={styles.statSubtext}>
            {formatCurrency(stats.inReviewAmount)}
          </Text>
        </View>

        {/* Tarjeta de Pagados */}
        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.statLabel}>Pagados</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {stats.paidCount}
          </Text>
          <Text style={styles.statSubtext}>
            {formatCurrency(stats.paidAmount)}
          </Text>
        </View>
      </View>

      {/* Gráfico de Pastel - Estado de Deudas */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Estado de Mis Deudas {selectedYear}</Text>
        <View style={styles.chartContainer}>
          <VictoryPie
            key={`pie-chart-${selectedYear}-${yearlyStats.requirePaymentCount}-${yearlyStats.inReviewCount}-${yearlyStats.paidCount}`}
            data={[
              ...(yearlyStats.requirePaymentCount > 0 ? [{ x: 'Requieren Pago', y: yearlyStats.requirePaymentCount, fill: '#EF4444' }] : []),
              ...(yearlyStats.inReviewCount > 0 ? [{ x: 'Revisión', y: yearlyStats.inReviewCount, fill: '#F59E0B' }] : []),
              ...(yearlyStats.paidCount > 0 ? [{ x: 'Pagados', y: yearlyStats.paidCount, fill: '#10B981' }] : []),
            ].length > 0 ? [
              ...(yearlyStats.requirePaymentCount > 0 ? [{ x: 'Requieren Pago', y: yearlyStats.requirePaymentCount, fill: '#EF4444' }] : []),
              ...(yearlyStats.inReviewCount > 0 ? [{ x: 'Revisión', y: yearlyStats.inReviewCount, fill: '#F59E0B' }] : []),
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
              <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Requieren Pago</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Revisión</Text>
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
            domain={{ y: [0, 3] }}
          >
            <VictoryAxis
              style={{
                axis: { stroke: '#e5e7eb' },
                tickLabels: { fontSize: 10, fill: '#6b7280' }
              }}
            />
            <VictoryAxis
              dependentAxis
              tickValues={[1, 2, 3]}
              tickFormat={['Requiere Pago', 'En Revisión', 'Pagado']}
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
                data: { fill: '#F59E0B' }
              }}
              barWidth={12}
            />
            <VictoryBar
              data={monthlyChartData.map(d => ({ 
                x: d.month, 
                y: d.requirePayment > 0 ? 1 : 0
              }))}
              style={{
                data: { fill: '#EF4444' }
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
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
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
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  yearFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  pickerContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 120,
  },
  picker: {
    height: 40,
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});
