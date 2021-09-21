import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'home.dart';
import 'login/login_page.dart';
import 'not_found_page.dart';

class RouteController extends StatelessWidget {
  final String pageName;
  const RouteController({
    Key? key,
    required this.pageName,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final userSignedIn = Provider.of<User?>(context) != null;

    final notSignedInGoHome = !userSignedIn && pageName == '/home';
    final singedInGoHome = userSignedIn && pageName == '/home';

    if (pageName == '/') {
      return Home();
    } else if (notSignedInGoHome || pageName == '/login') {
      return LoginPage();
    } else if (singedInGoHome) {
      return Home();
    } else {
      return NotFoundPage();
    }
  }
}
