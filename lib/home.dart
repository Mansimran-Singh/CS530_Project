import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class Home extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        automaticallyImplyLeading: false,
        elevation: 0,
        actions: [
          TextButton.icon(
            onPressed: ()=> FirebaseAuth.instance.signOut(),
            icon: const Icon(Icons.logout),
            label: const Text('Sign out'),
          )
        ],
      ),
      body: Center(
        child: Column(
          children: [
            Text(
              'HOME PAGE',
              style: Theme.of(context).textTheme.headline1,
            ),
            const SizedBox(
              height: 40,
            ),
            Text(
              'Coming soon...',
              style: Theme.of(context).textTheme.headline4,
            ),
          ],
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
        ),
      ),
    );
  }
}
