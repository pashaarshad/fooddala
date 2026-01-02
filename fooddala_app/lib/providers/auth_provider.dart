import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import 'dart:convert';

class AuthProvider with ChangeNotifier {
  User? _user;
  String? _token;
  bool _isLoading = false;
  final ApiService _api = ApiService();

  User? get user => _user;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;

  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.post('/auth/login', {
        'email': email,
        'password': password,
      });

      if (response['success']) {
        // Backend returns data.accessToken and data.user
        _token = response['data']['accessToken'];
        _user = User.fromJson(response['data']['user']);
        await _saveAuthData();
      }
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register(String name, String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.post('/auth/register', {
        'name': name,
        'email': email,
        'password': password,
        'role': 'customer',
      });

      if (response['success']) {
        // Backend returns data.accessToken and data.user
        _token = response['data']['accessToken'];
        _user = User.fromJson(response['data']['user']);
        await _saveAuthData();
      }
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loginWithGoogle() async {
    _isLoading = true;
    notifyListeners();

    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
      );
      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();

      if (googleUser == null) {
        _isLoading = false;
        notifyListeners();
        return; // User canceled
      }

      final response = await _api.post('/auth/google-firebase', {
        'email': googleUser.email,
        'name': googleUser.displayName,
        'googleId': googleUser.id,
        'photoUrl': googleUser.photoUrl,
      });

      if (response['success']) {
        _token = response['data']['accessToken'];
        _user = User.fromJson(response['data']['user']);
        await _saveAuthData();
      }
    } catch (e) {
      print("Google Login Error: $e");
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
  }

  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    if (!prefs.containsKey('token')) return;

    final token = prefs.getString('token');
    final userDataString = prefs.getString('userData');

    if (token != null && userDataString != null) {
      final userData = json.decode(userDataString);
      _token = token;
      _user = User.fromJson(userData);
      notifyListeners();
    }
  }

  Future<void> _saveAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    if (_token != null) {
      await prefs.setString('token', _token!);
    }
    if (_user != null) {
      await prefs.setString('userData', json.encode(_user!.toJson()));
    }
  }
}
