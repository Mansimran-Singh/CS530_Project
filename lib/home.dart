import 'package:flutter/material.dart';

class Home extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Material(
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
    );
  }
}
