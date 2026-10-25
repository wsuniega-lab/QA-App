import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { SignOff } from '../data/types';
import { colors } from '../theme';

export type Signature = SignOff['signature'];

const HEIGHT = 180;

export function SignaturePad({
  value,
  onChange,
  onDrawingChange,
}: {
  value: Signature | null;
  onChange: (sig: Signature | null) => void;
  /** Lets the parent stop scrolling while the inspector is signing. */
  onDrawingChange?: (drawing: boolean) => void;
}) {
  const [width, setWidth] = useState(0);
  const [live, setLive] = useState<string | null>(null);
  // Mirrors `live` so the move handler can append without waiting for a re-render.
  const livePath = useRef('');

  const point = (e: GestureResponderEvent) =>
    `${e.nativeEvent.locationX.toFixed(1)},${e.nativeEvent.locationY.toFixed(1)}`;

  const start = (e: GestureResponderEvent) => {
    livePath.current = `M${point(e)}`;
    setLive(livePath.current);
    onDrawingChange?.(true);
  };

  const move = (e: GestureResponderEvent) => {
    livePath.current += ` L${point(e)}`;
    setLive(livePath.current);
  };

  const finish = () => {
    let d = livePath.current;
    if (!d) return;
    // A tap with no movement still leaves a visible dot.
    if (!d.includes('L')) d += ' l0.1,0.1';
    onChange({ width, height: HEIGHT, paths: [...(value?.paths ?? []), { d }] });
    livePath.current = '';
    setLive(null);
    onDrawingChange?.(false);
  };

  const empty = !value?.paths.length && !live;

  return (
    <View>
      <View
        style={styles.pad}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={start}
        onResponderMove={move}
        onResponderRelease={finish}
        onResponderTerminate={finish}
      >
        <Svg width="100%" height={HEIGHT}>
          {value?.paths.map((p, i) => <Path key={i} d={p.d} {...stroke} />)}
          {live && <Path d={live} {...stroke} />}
        </Svg>
        {empty && (
          <Text style={styles.placeholder}>
            Sign here
          </Text>
        )}
        <View style={styles.line} />
      </View>
      <Pressable onPress={() => onChange(null)} style={styles.clear} hitSlop={8}>
        <Text style={styles.clearText}>Clear signature</Text>
      </Pressable>
    </View>
  );
}

const stroke = {
  stroke: '#0B1F3A',
  strokeWidth: 2.5,
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const styles = StyleSheet.create({
  pad: {
    height: HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  placeholder: {
    position: 'absolute',
    alignSelf: 'center',
    top: HEIGHT / 2 - 12,
    color: colors.muted,
    fontSize: 18,
    pointerEvents: 'none',
  },
  line: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 36,
    height: 1,
    backgroundColor: colors.border,
    pointerEvents: 'none',
  },
  clear: { alignSelf: 'flex-end', paddingVertical: 8 },
  clearText: { color: colors.primary, fontWeight: '600' },
});
