import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const LogoHeader = () => {
    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode='contain'
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 50,
        backgroundColor: '#181A1B', // Match background hex color
    },
    logo: {
        //width: 180, // Adjust size as needed
        height: 110, // Adjust size as needed
    },
});

export default LogoHeader;