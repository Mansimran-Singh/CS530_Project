
import 'package:cs530_project/home.dart';
import 'package:cs530_project/login/login_page.dart';
import 'package:cs530_project/not_found_page.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        StreamProvider<User?>(
          create: (context) => FirebaseAuth.instance.authStateChanges(),
          initialData: null,
      )
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Flutter Demo',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        initialRoute: '/home',
        onGenerateRoute: (page){
          // print(page.name);
          return MaterialPageRoute(builder: (context){
            return RouteController(pageName: page.name!);
          });
        },
        onUnknownRoute: (settings) {
          return MaterialPageRoute(
            builder: (context) {
              return NotFoundPage();
            },
          );
        },
      ),
    );
  }
}

class RouteController extends StatelessWidget {
  final String pageName;
  const RouteController({
    Key? key, required this.pageName,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final userSignedIn = Provider.of<User?>(context) != null;

    final notSignedInGoHome = !userSignedIn && pageName == '/home';
    final singedInGoHome = userSignedIn && pageName == '/home';

    if (pageName == '/') {
      return Home();
    }else if (notSignedInGoHome || pageName == '/login') {
      return LoginPage();      
    }else if (singedInGoHome) {
      return Home();  
    }else{
      return NotFoundPage();      
    }
    
  }
}
