import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();

  const cards = [
    { title: 'Dashboard', description: 'Ver estadísticas generales', color: '#3b82f6', screen: 'OwnerDashboard' },
    { title: 'Mis Deudas', description: 'Ver estado de mis deudas', color: '#F59E0B', screen: 'DebtsMenu' },
    { title: 'Mis Pagos', description: 'Historial de pagos', color: '#10B981', screen: 'PaymentsMenu' },
    { title: 'Mi Perfil', description: 'Gestionar mi información', color: '#6366f1', screen: 'Profile' },
    { title: 'Anuncios', description: 'Ver anuncios del condominio', color: '#8b5cf6', screen: 'Announcements' },
    { title: 'Reservaciones', description: 'Gestionar reservaciones', color: '#06b6d4', screen: 'Reservations' },
    { title: 'Mis Incidencias', description: 'Estado de reportes', color: '#f97316', screen: 'Incidents' },
    { title: 'Encuestas', description: 'Participar en encuestas', color: '#10b981', screen: 'Polls' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.firstName}!</Text>
        <Text style={styles.subtitle}>Bienvenido a CondoFlow</Text>
      </View>

      <View style={styles.cardsContainer}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: card.color }]}
            onPress={() => navigation.navigate(card.screen)}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingTop: 32,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  cardsContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  cardDescription: {
    fontSize: 13,
    color: '#6b7280',
    letterSpacing: 0.1,
  },
  cardArrow: {
    fontSize: 28,
    color: '#d1d5db',
    fontWeight: '300',
    marginLeft: 8,
  },
});
