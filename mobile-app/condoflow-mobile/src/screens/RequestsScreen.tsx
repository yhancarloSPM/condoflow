import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';

export default function RequestsScreen() {
  const navigation = useNavigation();

  const requestCards = [
    {
      id: 1,
      title: 'Registrar Pago',
      description: 'Enviar comprobante de pago',
      color: '#10B981',
      onPress: () => {
        navigation.navigate('CreatePayment' as never);
      },
    },
    {
      id: 2,
      title: 'Crear Reservación',
      description: 'Reservar áreas comunes',
      color: '#3B82F6',
      onPress: () => {
        navigation.navigate('Reservations' as never);
      },
    },
    {
      id: 3,
      title: 'Reportar Incidencia',
      description: 'Reportar un problema',
      color: '#F59E0B',
      onPress: () => {
        navigation.navigate('Incidents' as never);
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
          <Text style={styles.headerTitle}>Solicitudes</Text>
          <Text style={styles.headerSubtitle}>
            Crea y gestiona tus solicitudes
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {requestCards.map((card) => (
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
  arrow: {
    fontSize: 28,
    color: '#d1d5db',
    fontWeight: '300',
    marginLeft: 8,
  },
});
