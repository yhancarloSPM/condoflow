import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function QueriesScreen() {
  const navigation = useNavigation();

  const queryCards = [
    {
      id: 1,
      title: 'Mis Deudas',
      description: 'Ver estado de mis deudas',
      color: '#EF4444',
      badge: null,
      onPress: () => {
        navigation.navigate('DebtsMenu' as never);
      },
    },
    {
      id: 2,
      title: 'Mis Pagos',
      description: 'Historial de pagos',
      color: '#10B981',
      badge: null,
      onPress: () => {
        navigation.navigate('PaymentsMenu' as never);
      },
    },
    {
      id: 3,
      title: 'Mis Reservaciones',
      description: 'Ver mis reservaciones',
      color: '#3B82F6',
      badge: null,
      onPress: () => {
        navigation.navigate('Reservations' as never);
      },
    },
    {
      id: 4,
      title: 'Mis Incidencias',
      description: 'Estado de reportes',
      color: '#F59E0B',
      badge: null,
      onPress: () => {
        navigation.navigate('Incidents' as never);
      },
    },
    {
      id: 5,
      title: 'Anuncios',
      description: 'Ver anuncios del condominio',
      color: '#8B5CF6',
      badge: null,
      onPress: () => {
        navigation.navigate('Announcements' as never);
      },
    },
    {
      id: 6,
      title: 'Encuestas',
      description: 'Participar en encuestas',
      color: '#06B6D4',
      badge: null,
      onPress: () => {
        navigation.navigate('Polls' as never);
      },
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Consultas</Text>
          <Text style={styles.headerSubtitle}>
            Consulta tu información y estado
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {queryCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[styles.card, { borderLeftColor: card.color }]}
              onPress={card.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDescription}>{card.description}</Text>
                </View>
                {card.badge && (
                  <View style={[styles.badge, { backgroundColor: card.color }]}>
                    <Text style={styles.badgeText}>{card.badge}</Text>
                  </View>
                )}
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    letterSpacing: 0.2,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  arrow: {
    fontSize: 28,
    color: '#d1d5db',
    fontWeight: '300',
    marginLeft: 8,
  },
});
