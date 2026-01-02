import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/theme.dart';

// Role configuration matching the web app exactly
class RoleConfig {
  final IconData icon;
  final String label;
  final String description;
  final Color color;
  final String testEmail;
  final String testPassword;

  const RoleConfig({
    required this.icon,
    required this.label,
    required this.description,
    required this.color,
    required this.testEmail,
    required this.testPassword,
  });
}

final Map<String, RoleConfig> roleConfig = {
  'customer': const RoleConfig(
    icon: Icons.person,
    label: 'Customer',
    description: 'Order food from restaurants',
    color: Color(0xFFFF5722),
    testEmail: 'customer@fooddala.com',
    testPassword: 'customer123',
  ),
  'restaurant': const RoleConfig(
    icon: Icons.store,
    label: 'Restaurant',
    description: 'Manage your restaurant',
    color: Color(0xFF4CAF50),
    testEmail: 'restaurant@fooddala.com',
    testPassword: 'restaurant123',
  ),
  'driver': const RoleConfig(
    icon: Icons.delivery_dining,
    label: 'Delivery Partner',
    description: 'Deliver orders & earn',
    color: Color(0xFF2196F3),
    testEmail: 'driver@fooddala.com',
    testPassword: 'driver123',
  ),
};

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLogin = true;
  bool _showPassword = false;
  String _selectedRole = 'customer';
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);

    try {
      if (mounted) setState(() => _error = null);
      if (_isLogin) {
        await auth.login(_emailController.text, _passwordController.text);
      } else {
        await auth.register(
          _nameController.text,
          _emailController.text,
          _passwordController.text,
        );
      }
      // Navigation happens automatically via Consumer in main.dart
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception:', '').trim();
        });
      }
    }
  }

  void _autoFillCredentials() {
    final config = roleConfig[_selectedRole]!;
    setState(() {
      _emailController.text = config.testEmail;
      _passwordController.text = config.testPassword;
    });
  }

  @override
  Widget build(BuildContext context) {
    final currentConfig = roleConfig[_selectedRole]!;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 20),
                // Logo
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset(
                      'assets/images/logo.png',
                      height: 50,
                      width: 50,
                    ),
                    const SizedBox(width: 10),
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [Color(0xFFFF5722), Color(0xFFFFC107)],
                      ).createShader(bounds),
                      child: const Text(
                        'Fooddala',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  _isLogin ? 'Welcome Back!' : 'Create Account',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _isLogin
                      ? 'Login to access your ${currentConfig.label.toLowerCase()} dashboard'
                      : 'Sign up to get started',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textGrey),
                ),
                const SizedBox(height: 32),

                // Role Selection Tabs
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.cardDark,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: roleConfig.entries.map((entry) {
                      final isSelected = _selectedRole == entry.key;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () =>
                              setState(() => _selectedRole = entry.key),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? entry.value.color.withOpacity(0.2)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                              border: isSelected
                                  ? Border.all(
                                      color: entry.value.color,
                                      width: 2,
                                    )
                                  : null,
                            ),
                            child: Column(
                              children: [
                                Icon(
                                  entry.value.icon,
                                  color: isSelected
                                      ? entry.value.color
                                      : AppTheme.textGrey,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  entry.value.label,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: isSelected
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                    color: isSelected
                                        ? entry.value.color
                                        : AppTheme.textGrey,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 24),

                // Error Message
                if (_error != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.withOpacity(0.3)),
                    ),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),

                // Form
                Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      // Name Field (Register Mode)
                      if (!_isLogin)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: TextFormField(
                            controller: _nameController,
                            decoration: InputDecoration(
                              labelText: 'Full Name',
                              prefixIcon: const Icon(Icons.person_outline),
                              filled: true,
                              fillColor: AppTheme.cardDark,
                            ),
                            validator: (val) =>
                                val!.isEmpty ? 'Please enter name' : null,
                          ),
                        ),

                      // Email
                      TextFormField(
                        controller: _emailController,
                        decoration: InputDecoration(
                          labelText: 'Email',
                          prefixIcon: const Icon(Icons.email_outlined),
                          filled: true,
                          fillColor: AppTheme.cardDark,
                        ),
                        keyboardType: TextInputType.emailAddress,
                        validator: (val) =>
                            !val!.contains('@') ? 'Invalid email' : null,
                      ),
                      const SizedBox(height: 16),

                      // Password
                      TextFormField(
                        controller: _passwordController,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          filled: true,
                          fillColor: AppTheme.cardDark,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _showPassword
                                  ? Icons.visibility_off
                                  : Icons.visibility,
                            ),
                            onPressed: () =>
                                setState(() => _showPassword = !_showPassword),
                          ),
                        ),
                        obscureText: !_showPassword,
                        validator: (val) =>
                            val!.length < 6 ? 'Password too short' : null,
                      ),
                      const SizedBox(height: 24),

                      // Submit Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed:
                              Provider.of<AuthProvider>(context).isLoading
                              ? null
                              : _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: currentConfig.color,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: Provider.of<AuthProvider>(context).isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  _isLogin
                                      ? 'Login as ${currentConfig.label}'
                                      : 'Sign Up as ${currentConfig.label}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Auto-Fill Button (Like web)
                      OutlinedButton.icon(
                        onPressed: _autoFillCredentials,
                        icon: const Text('🧪'),
                        label: Text(
                          'Fill Test Credentials (${currentConfig.label})',
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: currentConfig.color,
                          side: BorderSide(
                            color: currentConfig.color.withOpacity(0.5),
                          ),
                          padding: const EdgeInsets.symmetric(
                            vertical: 12,
                            horizontal: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Switch Mode
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _isLogin
                          ? "Don't have an account? "
                          : 'Already have an account? ',
                      style: TextStyle(color: AppTheme.textGrey),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _isLogin = !_isLogin),
                      child: Text(
                        _isLogin ? 'Sign Up' : 'Login',
                        style: TextStyle(
                          color: currentConfig.color,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
