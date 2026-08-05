import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type AmbientTechBackgroundProps = {
    variant?: 'auth' | 'chat' | 'header';
};

export default function AmbientTechBackground({ variant = 'header' }: AmbientTechBackgroundProps) {
    const isAuth = variant === 'auth';
    const isChat = variant === 'chat';

    return (
        <View
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[styles.layer, isChat && styles.chatLayer]}
        >
            <Svg width="100%" height="100%" viewBox="0 0 390 280" preserveAspectRatio="xMidYMid slice">
                <Circle cx="328" cy="54" r={isAuth ? 92 : 70} fill={isChat ? '#0f766e08' : '#5eead40b'} />
                <Circle cx="52" cy="236" r={isAuth ? 78 : 58} fill={isChat ? '#0f766e06' : '#38bdf80a'} />
                <Path
                    d="M-12 188 H62 L82 168 H152 L171 149 H238 L258 129 H402"
                    fill="none"
                    stroke={isChat ? '#0f766e16' : '#99f6e42d'}
                    strokeWidth="1"
                />
                <Path
                    d="M248 -10 V42 L270 64 V112 L292 134 V286"
                    fill="none"
                    stroke={isChat ? '#0f766e12' : '#67e8f92a'}
                    strokeWidth="1"
                />
                <Path
                    d="M58 0 V56 L82 80 V116"
                    fill="none"
                    stroke={isChat ? '#0f766e10' : '#a7f3d025'}
                    strokeWidth="1"
                />
                {[['82', '168'], ['171', '149'], ['258', '129'], ['270', '64'], ['292', '134'], ['82', '80']].map(([cx, cy]) => (
                    <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill={isChat ? '#0f766e24' : '#ccfbf14d'} />
                ))}
                {isChat && (
                    <>
                        <Path d="M145 118 L195 84 L245 118 V177 L195 206 L145 177 Z" fill="none" stroke="#0f766e12" strokeWidth="2" />
                        <Path d="M168 151 H222 M195 128 V176" fill="none" stroke="#0f766e12" strokeWidth="2" strokeLinecap="round" />
                    </>
                )}
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    layer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    chatLayer: {
        opacity: 0.82,
    },
});
