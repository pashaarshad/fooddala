import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/restaurant_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/order_provider.dart';
import 'providers/favorites_provider.dart';
import 'providers/restaurant_order_provider.dart';
import 'providers/driver_order_provider.dart';
import 'utils/theme.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'screens/splash_screen.dart';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (kIsWeb) {
    await Firebase.initializeApp(
      options: const FirebaseOptions(
        apiKey: "AIzaSyAW4Vd0lDylLbiNLm-y2U5QlvYjBPVlOw4",
        appId: "1:536428139122:web:0e61b7a93f71d8c8d2e8eb",
        messagingSenderId: "536428139122",
        projectId: "fooddala-for--oath",
        authDomain: "fooddala-for--oath.firebaseapp.com",
        storageBucket: "fooddala-for--oath.firebasestorage.app",
        measurementId: "G-GK3G9GHM7D",
      ),
    );
  } else {
    // For Android/iOS, ensure google-services.json / GoogleService-Info.plist is present
    await Firebase.initializeApp();
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => RestaurantProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => FavoritesProvider()),
        ChangeNotifierProvider(create: (_) => RestaurantOrderProvider()),
        ChangeNotifierProvider(create: (_) => DriverOrderProvider()),
      ],
      child: MaterialApp(
        title: 'Fooddala',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: const AppEntry(),
      ),
    );
  }
}

class AppEntry extends StatefulWidget {
  const AppEntry({super.key});

  @override
  State<AppEntry> createState() => _AppEntryState();
}

class _AppEntryState extends State<AppEntry> {
  bool _showSplash = true;
  bool _isInit = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      _isInit = false;
      Provider.of<AuthProvider>(context, listen: false).tryAutoLogin();
    }
  }

  void _onSplashComplete() {
    if (mounted) {
      setState(() => _showSplash = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_showSplash) {
      return SplashScreen(onComplete: _onSplashComplete);
    }

    return Consumer<AuthProvider>(
      builder: (ctx, auth, _) {
        if (auth.isAuthenticated) {
          return const HomeScreen();
        }
        return const AuthScreen();
      },
    );
  }
}
