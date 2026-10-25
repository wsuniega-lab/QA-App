import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, StatusBadge } from '../components/ui';
import { pieceTitle } from '../data/inspection';
import { store } from '../data/storage';
import type { InspectionStatus, InspectionSummary } from '../data/types';
import { colors, statusLabels } from '../theme';

const FILTERS: (InspectionStatus | 'all')[] = ['all', 'draft', 'released', 'rejected'];

export default function InspectionList() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<InspectionSummary[] | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InspectionStatus | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      store.listInspections().then(setItems);
    }, []),
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter(
      (i) =>
        (filter === 'all' || i.status === filter) &&
        (!q ||
          [i.pieceMark, i.jobNumber, i.projectName, i.pieceType].some((f) => f.toLowerCase().includes(q))),
    );
  }, [items, query, filter]);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable hitSlop={12} accessibilityLabel="Settings">
                <Ionicons name="settings-outline" size={24} color={colors.primaryText} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search piece mark, job, project"
          placeholderTextColor={colors.muted}
          style={styles.search}
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filter, filter === f && styles.filterOn]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextOn]}>
              {f === 'all' ? 'All' : statusLabels[f]}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 + insets.bottom, gap: 10 }}
        ListEmptyComponent={
          items === null ? undefined : (
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyTitle}>
                {items.length === 0 ? 'No inspections yet' : 'No inspections match'}
              </Text>
              {items.length === 0 && (
                <Text style={styles.emptyText}>
                  Tap “New Inspection” to start a pre-pour check on a piece.
                </Text>
              )}
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/inspection/${item.id}`)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.rowTitle}>{pieceTitle(item)}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {[item.jobNumber && `Job ${item.jobNumber}`, item.projectName].filter(Boolean).join(' · ') ||
                  'No job info'}
              </Text>
              <Text style={styles.rowSub}>Pour {item.pourDate || 'not set'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <StatusBadge status={item.status} />
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </View>
          </Pressable>
        )}
      />

      <View style={[styles.fab, { paddingBottom: 16 + insets.bottom }]}>
        <Button title="New Inspection" icon="add-circle" onPress={() => router.push('/new')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: { flex: 1, paddingVertical: 10, fontSize: 16, color: colors.text },
  filters: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 10, flexWrap: 'wrap' },
  filter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, color: colors.text },
  filterTextOn: { color: '#fff', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 13, color: colors.muted },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 15, color: colors.muted, textAlign: 'center', maxWidth: 280 },
  fab: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
