export interface CodeExample {
  id: string
  title: string
  description: string
  code: string
}

export const DEFAULT_EXAMPLE = `pub fn sumar (a : i32, b : i32) i32 {
  return a + b;
}

pub fn main () void {
  var x = 42;
  var y = sumar(x, 8);
  print(y);

  if (y > 40) then {
    print("mayor");
  } else then {
    print("menor");
  }
}
`

export const EXAMPLES: CodeExample[] = [
  {
    id: "default",
    title: "Programa de bienvenida",
    description: "Funciones, variables e if/else",
    code: DEFAULT_EXAMPLE,
  },
  {
    id: "vars",
    title: "Variables y constantes",
    description: "Declaraciones con var y const",
    code: `pub fn main () void {
  var x = 10;
  const PI : f64 = 3.14;
  var activo = true;
  var letra = 'A';
  var hex = 0xFF;
  var bin = 0b1010;
  print(x);
  print(hex);
}
`,
  },
  {
    id: "structs",
    title: "Structs y unions",
    description: "Tipos compuestos y acceso a campos",
    code: `struct Punto {
  x : i32;
  y : i32;
}

union Valor {
  entero : i32;
  flotante : f64;
}

pub fn main () void {
  var p = new Punto;
  p.x = 10;
  p.y = 20;
  print(p.x);
}
`,
  },
  {
    id: "functions",
    title: "Funciones",
    description: "Funciones públicas y privadas",
    code: `pub fn cuadrado (n : i32) i32 {
  return n * n;
}

pub fn aplicar (n : i32) i32 {
  var r = cuadrado(n);
  return r + 1;
}

pub fn main () void {
  print(aplicar(5));
}
`,
  },
  {
    id: "pointers",
    title: "Punteros y arreglos",
    description: "Punteros *T, arreglos [n]T y opcionales ?T",
    code: `pub fn main () void {
  var arr : [4]i32 = undefined;
  arr[0] = 10;
  arr[1] = 20;

  var x = 5;
  var ptr : *i32 = &x;
  *ptr = 999;

  var opcional : ?i32 = null;
  print(arr[0]);
}
`,
  },
  {
    id: "control",
    title: "If / while / break",
    description: "Flujo de control y bucles",
    code: `pub fn main () void {
  var i = 0;
  while (i < 10) {
    if (i == 5) then {
      break;
    } else then {
      print(i);
    }
    i = i + 1;
  }
}
`,
  },
  {
    id: "arithmetic",
    title: "Expresiones aritméticas",
    description: "Operadores y precedencia",
    code: `pub fn main () void {
  var a = 2 + 3 * 4;
  var b = (10 - 2) / 4;
  var c = 15 % 4;
  var d = a + b - c;
  print(d);
}
`,
  },
  {
    id: "switch",
    title: "Switch",
    description: "Selección múltiple con else",
    code: `pub fn clasificar (n : i32) void {
  switch (n) {
    0 => { print("cero"); },
    1 => { print("uno"); },
    else => { print("otro"); },
  }
}

pub fn main () void {
  clasificar(1);
}
`,
  },
  {
    id: "comptime",
    title: "Comptime",
    description: "Bloques de evaluación en compilación",
    code: `comptime {
  const TAM = 8 * 4;
}

pub fn main () void {
  var buffer : [32]u8 = undefined;
  buffer[0] = 65;
  print(buffer[0]);
}
`,
  },
  {
    id: "factorial",
    title: "Factorial / Fibonacci",
    description: "Programa completo con recursión",
    code: `pub fn factorial (n : i32) i32 {
  if (n <= 1) then {
    return 1;
  } else then {
    return n * factorial(n - 1);
  }
}

pub fn fibonacci (n : i32) i32 {
  if (n < 2) then {
    return n;
  } else then {
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
}

pub fn main () void {
  var f = factorial(5);
  var fib = fibonacci(10);
  print(f);
  print(fib);
}
`,
  },
]
