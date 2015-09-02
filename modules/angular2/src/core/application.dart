library angular2.src.core.application;

import 'dart:async';

import 'package:angular2/src/core/reflection/reflection.dart' show reflector;
import 'package:angular2/src/core/reflection/reflection_capabilities.dart'
    show ReflectionCapabilities;
import 'application_common.dart';

export 'application_common.dart' show ApplicationRef;
import 'package:angular2/src/core/compiler/dynamic_component_loader.dart';
export 'package:angular2/src/core/compiler/dynamic_component_loader.dart' show ComponentRef;

/// Starts an application from a root component. This implementation uses
/// mirrors. Angular 2 transformer automatically replaces this method with a
/// static implementation (see `application_static.dart`) that does not use
/// mirrors and produces a faster and more compact JS code.
///
/// See [commonBootstrap] for detailed documentation.
Future<ComponentRef> bootstrap(Type appComponentType,
    [List componentInjectableBindings]) {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
  return commonBootstrap(appComponentType, componentInjectableBindings);
}
