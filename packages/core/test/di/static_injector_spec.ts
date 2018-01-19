/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Inject, Injectable, InjectionToken, Injector, InjectorDefType, NgModule, Optional, Self, SkipSelf, forwardRef} from '@angular/core';
import {convertImports, convertStaticProviders} from '@angular/core/src/metadata/ng_module';
import {ReflectionCapabilities} from '@angular/core/src/reflection/reflection_capabilities';
import {expect} from '@angular/platform-browser/testing/src/matchers';

import {stringify} from '../../src/util';

class Engine {
  static PROVIDER = {provide: Engine, useClass: Engine, deps: []};
}

class BrokenEngine {
  static PROVIDER = {provide: Engine, useClass: BrokenEngine, deps: []};
  constructor() { throw new Error('Broken Engine'); }
}

class DashboardSoftware {
  static PROVIDER = {provide: DashboardSoftware, useClass: DashboardSoftware, deps: []};
}

class Dashboard {
  static PROVIDER = {provide: Dashboard, useClass: Dashboard, deps: [DashboardSoftware]};
  constructor(software: DashboardSoftware) {}
}

class TurboEngine extends Engine {
  static PROVIDER = {provide: Engine, useClass: TurboEngine, deps: []};
}

class Car {
  static PROVIDER = {provide: Car, useClass: Car, deps: [Engine]};
  constructor(public engine: Engine) {}
}

class CarWithOptionalEngine {
  static PROVIDER = {
    provide: CarWithOptionalEngine,
    useClass: CarWithOptionalEngine,
    deps: [[new Optional(), Engine]]
  };
  constructor(public engine: Engine) {}
}

class CarWithDashboard {
  static PROVIDER = {
    provide: CarWithDashboard,
    useClass: CarWithDashboard,
    deps: [Engine, Dashboard]
  };
  engine: Engine;
  dashboard: Dashboard;
  constructor(engine: Engine, dashboard: Dashboard) {
    this.engine = engine;
    this.dashboard = dashboard;
  }
}

class SportsCar extends Car {
  static PROVIDER = {provide: Car, useClass: SportsCar, deps: [Engine]};
}

class CyclicEngine {
  static PROVIDER = {provide: Engine, useClass: CyclicEngine, deps: [Car]};
  constructor(car: Car) {}
}

class NoAnnotations {
  constructor(secretDependency: any) {}
}

function factoryFn(a: any){}

{
  const dynamicProviders = [
    {provide: 'provider0', useValue: 1}, {provide: 'provider1', useValue: 1},
    {provide: 'provider2', useValue: 1}, {provide: 'provider3', useValue: 1},
    {provide: 'provider4', useValue: 1}, {provide: 'provider5', useValue: 1},
    {provide: 'provider6', useValue: 1}, {provide: 'provider7', useValue: 1},
    {provide: 'provider8', useValue: 1}, {provide: 'provider9', useValue: 1},
    {provide: 'provider10', useValue: 1}
  ];

  describe(`StaticInjector`, () => {

    it('should instantiate a class without dependencies', () => {
      const injector = Injector.create([Engine.PROVIDER]);
      const engine = injector.get(Engine);

      expect(engine).toBeAnInstanceOf(Engine);
    });

    it('should instantiate a class in module from symbol', () => {

      class Foo {}

      @NgModule({
        imports: [],
      })
      class SalutationModule {
      }

      @Injectable({targetScope: SalutationModule, deps: [Foo]})
      class Greeter {
        constructor(foo: Foo) {}
      }

      @Injectable({targetScope: SalutationModule, deps: []})
      class Toast {
      }

      @NgModule({imports: [SalutationModule]})
      class MyAppModule {
        constructor(toast: Toast) {}
      }
      const injector = Injector.create([SalutationModule as InjectorDefType<any>]);

      const toast = injector.get<Toast>(Toast);
      expect(toast).toBeAnInstanceOf(Toast);
    });

    // TODO(tinayuangao): change the public API to take `Type` so we can avoid casts once
    // Microsoft/TypeScript#4881
    //     is solved.
    it('should instantiate a class with dependencies in module', () => {
      @NgModule({
        imports: [],
      })
      class SalutationModule {
      }

      @Injectable({targetScope: SalutationModule, deps: []})
      class Foo {
      }

      @Injectable({targetScope: SalutationModule, deps: [Foo]})
      class Greeter {
        constructor(foo: Foo) {}
      }

      @Injectable({targetScope: SalutationModule, deps: []})
      class Toast {
      }

      @NgModule({imports: [SalutationModule]})
      class MyAppModule {
        constructor(toast: Toast) {}
      }

      debugger;

      const injector = Injector.create([SalutationModule as InjectorDefType<any>]);

      const greeter = injector.get<Greeter>(Greeter);
      expect(greeter).toBeAnInstanceOf(Greeter);
    });

    it(`should parent providers override child module's providers`, () => {
      class Foo {}

      @NgModule({providers: [{provide: Foo, useValue: 'fooChild'}]})
      class ModuleChild {
      }

      @NgModule({providers: [{provide: Foo, useValue: 'fooParent'}], imports: [ModuleChild]})
      class ModuleParent {
      }

      const injector = Injector.create([ModuleParent as InjectorDefType<any>]);

      expect(injector.get<Foo>(Foo)).toBe('fooParent');
    });

    it('should delegate to parent injector', () => {
      class Foo {}

      @NgModule({providers: [{provide: Foo, useValue: 'fooChild'}]})
      class ModuleChild {
      }

      @NgModule({providers: [{provide: Foo, useValue: 'fooParent'}], imports: [ModuleChild]})
      class ModuleParent {
      }

      const injector = Injector.create([ModuleParent as InjectorDefType<any>]);
      const childInjector = Injector.create([], injector);

      expect(childInjector.get<Foo>(Foo)).toBe('fooParent');
    });

    it('should instantiate a module eagerly', () => {
      let moduleInstantiated: boolean = false;
      class Foo {}

      @NgModule({
        imports: [],
      })
      class SalutationModule {
        constructor() { moduleInstantiated = true; }
      }

      @Injectable({targetScope: SalutationModule, deps: [Foo]})
      class Greeter {
        constructor(foo: Foo) {}
      }
      const injector = Injector.create([SalutationModule as InjectorDefType<any>]);

      expect(moduleInstantiated).toBeTruthy(`Module should be eagerly instantiated`);
    });

    it('should injectable provide 0 value works', () => {
      @NgModule()
      class SalutationModule {
      }

      @Injectable({targetScope: SalutationModule, useValue: 0})
      class Greeting {
      }

      const injector = Injector.create([SalutationModule as InjectorDefType<any>]);

      expect(injector.get<Greeting>(Greeting)).toBe(0, `Expect Greeting to be 0`);
    });

    it('should work with optional provide', () => {
      @NgModule()
      class SalutationModule {
      }

      @Injectable({targetScope: SalutationModule})
      class Greeting {
      }

      const injector = Injector.create([SalutationModule as InjectorDefType<any>]);
      debugger;

      expect(injector.get<Greeting>(Greeting)).toBeAnInstanceOf(Greeting);
    });

    it('should work with optional provide and dependencies', () => {
      @NgModule()
      class SalutationModule {
      }

      @Injectable({targetScope: SalutationModule, useValue: 1})
      class Foo {
      }

      @Injectable({targetScope: SalutationModule})
      class Greeting {
        constructor(foo: Foo) { expect(foo).toBe(1); }
      }

      const injector = Injector.create([SalutationModule as InjectorDefType<any>]);

      expect(injector.get<Greeting>(Greeting)).toBeAnInstanceOf(Greeting);
    });

    it('should work with @Optional dependencies in constructor', () => {
      @NgModule()
      class SalutationModule {
      }

      @Injectable()
      class Foo {
      }

      @Injectable({targetScope: SalutationModule})
      class Greeting {
        constructor(@Optional() foo: Foo) { expect(foo).toBe(null); }
      }

      const injector = Injector.create([SalutationModule as InjectorDefType<any>]);

      expect(injector.get<Greeting>(Greeting)).toBeAnInstanceOf(Greeting);
    });

    it('should work with @Optional dependencies in deps', () => {
      @NgModule()
      class SalutationModule {
      }

      @Injectable()
      class Foo {
      }

      @Injectable({targetScope: SalutationModule, deps: [[new Optional(), Foo]]})
      class Greeting {
        constructor(foo: Foo) { expect(foo).toBe(null); }
      }

      const injector = Injector.create([SalutationModule as InjectorDefType<any>]);

      expect(injector.get<Greeting>(Greeting)).toBeAnInstanceOf(Greeting);
    });

    fit('should work with @Inject dependency', () => {
      @NgModule()
      class SalutationModule {
      }

      @Injectable({targetScope: SalutationModule, useValue: 1})
      class Foo {
      }

      @Injectable({targetScope: SalutationModule})
      class Greeting {
        constructor(@Inject(Foo) foo: any) { expect(foo).toBe(1); }
      }

      const injector = Injector.create([SalutationModule as InjectorDefType<any>]);

      expect(injector.get<Greeting>(Greeting)).toBeAnInstanceOf(Greeting);
    });


    it('should class provider works', () => {
      @NgModule()
      class ShapeModule {
      }

      @Injectable({targetScope: ShapeModule})
      class Square {
        name = 'square';
      }

      @Injectable({targetScope: ShapeModule, useClass: Square})
      abstract class Shape {
        name: string;
      }

      const injector = Injector.create([ShapeModule as InjectorDefType<any>]);

      const shape: Shape = injector.get(Shape);
      expect(shape.name).toEqual('square');
      expect(shape instanceof Square).toBe(true);
    });

    it('should not instantiate Injectable from not our NgModule', () => {
      @NgModule()
      class ShapeModule {
      }

      @NgModule()
      class SalutationModule {
      }

      @Injectable({targetScope: SalutationModule, deps: []})
      class Greeting {
      }

      const foreignInjector = Injector.create([ShapeModule as InjectorDefType<any>]);

      const e =
          `StaticInjectorError[${stringify(Greeting)}]: \n  NullInjectorError: No provider for ${stringify(Greeting)}!`;
      expect(() => foreignInjector.get<Greeting>(Greeting)).toThrowError(e);

      const targetInjector = Injector.create([SalutationModule as InjectorDefType<any>]);
      const greeting = targetInjector.get<Greeting>(Greeting);
      expect(greeting).toBeAnInstanceOf(Greeting);
    });

    it('should convert static providers work', () => {
      class Greeting {}
      class Toast {}
      class GreetingTimes {}
      class ToastTimes {}
      class Title {}

      const valueProvider = {provide: GreetingTimes, useValue: 1};
      const existingProvider = {provide: Greeting, useExisting: GreetingTimes};
      const classProvider = {provide: Toast, useClass: Greeting};
      const factoryProvider = {
        provide: ToastTimes,
        useFactory: (times: number) => times + 1,
        deps: [GreetingTimes]
      };
      const typeProvider = Title;

      const module = {
        providers: [valueProvider, existingProvider, factoryProvider, classProvider, typeProvider]
      };

      const providers = convertStaticProviders(module.providers, new ReflectionCapabilities());

      expect(providers.length).toBe(5);
      expect(providers[0]).toBe(valueProvider, `Expect ValueProvider doesn't change`);
      expect(providers[1]).toBe(existingProvider, `Expect ExistingProvider doesn't change`);
      expect(providers[2]).toBe(factoryProvider, `Expect FactoryProvider doesn't change`);
      expect((providers[3] as{deps: any}).deps)
          .toBeTruthy('Expect convert ClassProvider to StaticClassProvider');
      expect((providers[4] as{deps: any}).deps)
          .toBeTruthy('Expect convert TypeProvider to ConstructorProvider');
    });

    it('should convert static providers recursively', () => {
      class Greeting {}
      class Toast {}
      class GreetingTimes {}
      class ToastTimes {}
      class Title {}

      const valueProvider = {provide: GreetingTimes, useValue: 1};
      const existingProvider = {provide: Greeting, useExisting: GreetingTimes};
      const classProvider = {provide: Toast, useClass: Greeting};
      const factoryProvider = {
        provide: ToastTimes,
        useFactory: (times: number) => times + 1,
        deps: [GreetingTimes]
      };
      const typeProvider = Title;

      const module = {
        providers:
            [valueProvider, [existingProvider, [factoryProvider]], classProvider, typeProvider]
      };

      const providers = convertStaticProviders(module.providers, new ReflectionCapabilities());

      expect(providers.length).toBe(5);
      expect(providers[0]).toBe(valueProvider, `Expect ValueProvider doesn't change`);
      expect(providers[1]).toBe(existingProvider, `Expect ExistingProvider doesn't change`);
      expect(providers[2]).toBe(factoryProvider, `Expect FactoryProvider doesn't change`);
      expect((providers[3] as{deps: any}).deps)
          .toBeTruthy('Expect convert ClassProvider to StaticClassProvider');
      expect((providers[4] as{deps: any}).deps)
          .toBeTruthy('Expect convert TypeProvider to ConstructorProvider');
    });

    it('should convert imports correctly', () => {
      class GreetingTimes {}

      const valueProvider = {provide: GreetingTimes, useValue: 1};

      @NgModule()
      class GreetingModule {
      }
      @NgModule()
      class ToastModule {
      }
      @NgModule()
      class GreetingTimesModule {
      }
      @NgModule()
      class ToastTimesModule {
      }
      @NgModule()
      class TitleModule {
      }

      const moduleWithProviders = {ngModule: GreetingTimesModule, providers: [valueProvider]};

      const module = {
        imports:
            [GreetingModule, [ToastModule, [moduleWithProviders]], ToastTimesModule, TitleModule]
      };

      const imports = convertImports(module.imports, new ReflectionCapabilities());

      expect(imports.length).toBe(5);
      imports.forEach(moduleImport => expect(moduleImport.ngInjectorDef).not.toBeUndefined());
    });

    it('should resolve dependencies based on type information', () => {
      const injector = Injector.create([Engine.PROVIDER, Car.PROVIDER]);
      const car = injector.get<Car>(Car);

      expect(car).toBeAnInstanceOf(Car);
      expect(car.engine).toBeAnInstanceOf(Engine);
    });

    it('should cache instances', () => {
      const injector = Injector.create([Engine.PROVIDER]);

      const e1 = injector.get(Engine);
      const e2 = injector.get(Engine);

      expect(e1).toBe(e2);
    });

    it('should provide to a value', () => {
      const injector = Injector.create([{provide: Engine, useValue: 'fake engine'}]);

      const engine = injector.get(Engine);
      expect(engine).toEqual('fake engine');
    });

    it('should inject dependencies instance of InjectionToken', () => {
      const TOKEN = new InjectionToken<string>('token');

      const injector = Injector.create([
        {provide: TOKEN, useValue: 'by token'},
        {provide: Engine, useFactory: (v: string) => v, deps: [[TOKEN]]},
      ]);

      const engine = injector.get(Engine);
      expect(engine).toEqual('by token');
    });

    it('should provide to a factory', () => {
      function sportsCarFactory(e: any) { return new SportsCar(e); }

      const injector = Injector.create(
          [Engine.PROVIDER, {provide: Car, useFactory: sportsCarFactory, deps: [Engine]}]);

      const car = injector.get<Car>(Car);
      expect(car).toBeAnInstanceOf(SportsCar);
      expect(car.engine).toBeAnInstanceOf(Engine);
    });

    it('should supporting provider to null', () => {
      const injector = Injector.create([{provide: Engine, useValue: null}]);
      const engine = injector.get(Engine);
      expect(engine).toBeNull();
    });

    it('should provide to an alias', () => {
      const injector = Injector.create([
        Engine.PROVIDER, {provide: SportsCar, useClass: SportsCar, deps: [Engine]},
        {provide: Car, useExisting: SportsCar}
      ]);

      const car = injector.get(Car);
      const sportsCar = injector.get(SportsCar);
      expect(car).toBeAnInstanceOf(SportsCar);
      expect(car).toBe(sportsCar);
    });

    it('should support multiProviders', () => {
      const injector = Injector.create([
        Engine.PROVIDER, {provide: Car, useClass: SportsCar, deps: [Engine], multi: true},
        {provide: Car, useClass: CarWithOptionalEngine, deps: [Engine], multi: true}
      ]);

      const cars = injector.get(Car) as any as Car[];
      expect(cars.length).toEqual(2);
      expect(cars[0]).toBeAnInstanceOf(SportsCar);
      expect(cars[1]).toBeAnInstanceOf(CarWithOptionalEngine);
    });

    it('should support multiProviders that are created using useExisting', () => {
      const injector = Injector.create([
        Engine.PROVIDER, {provide: SportsCar, useClass: SportsCar, deps: [Engine]},
        {provide: Car, useExisting: SportsCar, multi: true}
      ]);

      const cars = injector.get(Car) as any as Car[];
      expect(cars.length).toEqual(1);
      expect(cars[0]).toBe(injector.get(SportsCar));
    });

    it('should throw when the aliased provider does not exist', () => {
      const injector = Injector.create([{provide: 'car', useExisting: SportsCar}]);
      const e =
          `StaticInjectorError[car -> ${stringify(SportsCar)}]: \n  NullInjectorError: No provider for ${stringify(SportsCar)}!`;
      expect(() => injector.get('car')).toThrowError(e);
    });

    it('should handle forwardRef in useExisting', () => {
      const injector = Injector.create([
        {provide: 'originalEngine', useClass: forwardRef(() => Engine), deps: []}, {
          provide: 'aliasedEngine',
          useExisting: <any>forwardRef(() => 'originalEngine'),
          deps: []
        }
      ]);
      expect(injector.get('aliasedEngine')).toBeAnInstanceOf(Engine);
    });

    it('should support overriding factory dependencies', () => {
      const injector = Injector.create([
        Engine.PROVIDER,
        {provide: Car, useFactory: (e: Engine) => new SportsCar(e), deps: [Engine]}
      ]);

      const car = injector.get<Car>(Car);
      expect(car).toBeAnInstanceOf(SportsCar);
      expect(car.engine).toBeAnInstanceOf(Engine);
    });

    it('should support optional dependencies', () => {
      const injector = Injector.create([CarWithOptionalEngine.PROVIDER]);

      const car = injector.get<CarWithOptionalEngine>(CarWithOptionalEngine);
      expect(car.engine).toEqual(null);
    });

    it('should flatten passed-in providers', () => {
      const injector = Injector.create([[[Engine.PROVIDER, Car.PROVIDER]]]);

      const car = injector.get(Car);
      expect(car).toBeAnInstanceOf(Car);
    });

    it('should use the last provider when there are multiple providers for same token', () => {
      const injector = Injector.create([
        {provide: Engine, useClass: Engine, deps: []},
        {provide: Engine, useClass: TurboEngine, deps: []}
      ]);

      expect(injector.get(Engine)).toBeAnInstanceOf(TurboEngine);
    });

    it('should use non-type tokens', () => {
      const injector = Injector.create([{provide: 'token', useValue: 'value'}]);

      expect(injector.get('token')).toEqual('value');
    });

    it('should throw when given invalid providers', () => {
      expect(() => Injector.create(<any>['blah']))
          .toThrowError('StaticInjectorError[blah]: Unexpected provider');
    });

    it('should throw when missing deps', () => {
      expect(() => Injector.create(<any>[{provide: Engine, useClass: Engine}]))
          .toThrowError(
              'StaticInjectorError[{provide:Engine, useClass:Engine}]: \'deps\' required');
    });

    it('should throw when using reflective API', () => {
      expect(() => Injector.create(<any>[Engine]))
          .toThrowError('StaticInjectorError[Engine]: Function/Class not supported');
    });

    it('should throw when unknown provider shape API', () => {
      expect(() => Injector.create(<any>[{provide: 'abc', deps: [Engine]}]))
          .toThrowError(
              'StaticInjectorError[{provide:"abc", deps:[Engine]}]: StaticProvider does not have [useValue|useFactory|useExisting|useClass] or [provide] is not newable');
    });

    it('should throw when given invalid providers and serialize the provider', () => {
      expect(() => Injector.create(<any>[{foo: 'bar', bar: Car}]))
          .toThrowError('StaticInjectorError[{foo:"bar", bar:Car}]: Unexpected provider');
    });

    it('should provide itself', () => {
      const parent = Injector.create([]);
      const child = Injector.create([], parent);

      expect(child.get(Injector)).toBe(child);
    });

    it('should throw when no provider defined', () => {
      const injector = Injector.create([]);
      expect(() => injector.get('NonExisting'))
          .toThrowError(
              'StaticInjectorError[NonExisting]: \n  NullInjectorError: No provider for NonExisting!');
    });

    it('should show the full path when no provider', () => {
      const injector =
          Injector.create([CarWithDashboard.PROVIDER, Engine.PROVIDER, Dashboard.PROVIDER]);
      expect(() => injector.get(CarWithDashboard))
          .toThrowError(
              `StaticInjectorError[${stringify(CarWithDashboard)} -> ${stringify(Dashboard)} -> DashboardSoftware]: ` +
              `\n  NullInjectorError: No provider for DashboardSoftware!`);
    });

    it('should throw when trying to instantiate a cyclic dependency', () => {
      const injector = Injector.create([Car.PROVIDER, CyclicEngine.PROVIDER]);

      expect(() => injector.get(Car))
          .toThrowError(
              `StaticInjectorError[${stringify(Car)} -> ${stringify(Engine)} -> ${stringify(Car)}]: Circular dependency`);
    });

    it('should show the full path when error happens in a constructor', () => {
      const error = new Error('MyError');
      const injector = Injector.create(
          [Car.PROVIDER, {provide: Engine, useFactory: () => { throw error; }, deps: []}]);

      try {
        injector.get(Car);
        throw 'Must throw';
      } catch (e) {
        expect(e).toBe(error);
        expect(e.message).toContain(
            `StaticInjectorError[${stringify(Car)} -> Engine]: \n  MyError`);
        expect(e.ngTokenPath[0]).toEqual(Car);
        expect(e.ngTokenPath[1]).toEqual(Engine);
      }
    });

    it('should instantiate an object after a failed attempt', () => {
      let isBroken = true;

      const injector = Injector.create([
        Car.PROVIDER, {
          provide: Engine,
          useFactory: (() => isBroken ? new BrokenEngine() : new Engine()),
          deps: []
        }
      ]);

      expect(() => injector.get(Car))
          .toThrowError('StaticInjectorError[Car -> Engine]: \n  Broken Engine');

      isBroken = false;

      expect(injector.get(Car)).toBeAnInstanceOf(Car);
    });

    it('should support null/undefined values', () => {
      const injector = Injector.create([
        {provide: 'null', useValue: null},
        {provide: 'undefined', useValue: undefined},
      ]);
      expect(injector.get('null')).toBe(null);
      expect(injector.get('undefined')).toBe(undefined);
    });

  });


  describe('child', () => {
    it('should load instances from parent injector', () => {
      const parent = Injector.create([Engine.PROVIDER]);
      const child = Injector.create([], parent);

      const engineFromParent = parent.get(Engine);
      const engineFromChild = child.get(Engine);

      expect(engineFromChild).toBe(engineFromParent);
    });

    it('should not use the child providers when resolving the dependencies of a parent provider',
       () => {
         const parent = Injector.create([Car.PROVIDER, Engine.PROVIDER]);
         const child = Injector.create([TurboEngine.PROVIDER], parent);

         const carFromChild = child.get<Car>(Car);
         expect(carFromChild.engine).toBeAnInstanceOf(Engine);
       });

    it('should create new instance in a child injector', () => {
      const parent = Injector.create([Engine.PROVIDER]);
      const child = Injector.create([TurboEngine.PROVIDER], parent);

      const engineFromParent = parent.get(Engine);
      const engineFromChild = child.get(Engine);

      expect(engineFromParent).not.toBe(engineFromChild);
      expect(engineFromChild).toBeAnInstanceOf(TurboEngine);
    });

    it('should give access to parent', () => {
      const parent = Injector.create([]);
      const child = Injector.create([], parent);
      expect((child as any).parent).toBe(parent);
    });
  });


  describe('instantiate', () => {
    it('should instantiate an object in the context of the injector', () => {
      const inj = Injector.create([Engine.PROVIDER]);
      const childInj = Injector.create([Car.PROVIDER], inj);
      const car = childInj.get<Car>(Car);
      expect(car).toBeAnInstanceOf(Car);
      expect(car.engine).toBe(inj.get(Engine));
    });
  });

  describe('depedency resolution', () => {
    describe('@Self()', () => {
      it('should return a dependency from self', () => {
        const inj = Injector.create([
          Engine.PROVIDER,
          {provide: Car, useFactory: (e: Engine) => new Car(e), deps: [[Engine, new Self()]]}
        ]);

        expect(inj.get(Car)).toBeAnInstanceOf(Car);
      });

      it('should throw when not requested provider on self', () => {
        const parent = Injector.create([Engine.PROVIDER]);
        const child = Injector.create(
            [{provide: Car, useFactory: (e: Engine) => new Car(e), deps: [[Engine, new Self()]]}],
            parent);

        expect(() => child.get(Car))
            .toThrowError(
                `StaticInjectorError[${stringify(Car)} -> ${stringify(Engine)}]: \n` +
                `  NullInjectorError: No provider for Engine!`);
      });
    });

    describe('default', () => {
      it('should skip self', () => {
        const parent = Injector.create([Engine.PROVIDER]);
        const child = Injector.create(
            [
              TurboEngine.PROVIDER,
              {provide: Car, useFactory: (e: Engine) => new Car(e), deps: [[SkipSelf, Engine]]}
            ],
            parent);

        expect(child.get<Car>(Car).engine).toBeAnInstanceOf(Engine);
      });
    });
  });

  describe('resolve', () => {
    it('should throw when mixing multi providers with regular providers', () => {
      expect(() => {
        Injector.create(
            [{provide: Engine, useClass: BrokenEngine, deps: [], multi: true}, Engine.PROVIDER]);
      }).toThrowError(/Cannot mix multi providers and regular providers/);

      expect(() => {
        Injector.create(
            [Engine.PROVIDER, {provide: Engine, useClass: BrokenEngine, deps: [], multi: true}]);
      }).toThrowError(/Cannot mix multi providers and regular providers/);
    });

    it('should resolve forward references', () => {
      const injector = Injector.create([
        [{provide: forwardRef(() => BrokenEngine), useClass: forwardRef(() => Engine), deps: []}], {
          provide: forwardRef(() => String),
          useFactory: (e: any) => e,
          deps: [forwardRef(() => BrokenEngine)]
        }
      ]);
      expect(injector.get(String)).toBeAnInstanceOf(Engine);
      expect(injector.get(BrokenEngine)).toBeAnInstanceOf(Engine);
    });

    it('should support overriding factory dependencies with dependency annotations', () => {
      const injector = Injector.create([
        Engine.PROVIDER,
        {provide: 'token', useFactory: (e: any) => e, deps: [[new Inject(Engine)]]}
      ]);

      expect(injector.get('token')).toBeAnInstanceOf(Engine);
    });
  });

  describe('displayName', () => {
    it('should work', () => {
      expect(Injector.create([Engine.PROVIDER, {provide: BrokenEngine, useValue: null}]).toString())
          .toEqual('StaticInjector[Injector, Engine, BrokenEngine]');
    });
  });
}
