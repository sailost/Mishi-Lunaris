# Mishi y la Noche de las Estrellas Caídas

Videojuego arcade desarrollado con JavaScript y Phaser 3.90.0. Mishi recorre cinco escenarios para recuperar las estrellas de Lunaris y enfrentarse a la Bruja Sombra.

## Ejecución

Abre `index.html` en el navegador. El juego incluye sus recursos y funciona sin instalar dependencias.

Para usar un servidor local, con Node.js instalado:

```bash
npm start
```

Dirección local: `http://localhost:4173`.

## Controles

| Acción   | Computadora             | Celular y tablet             |
| -------- | ----------------------- | ---------------------------- |
| Volar    | WASD o flechas          | Cruceta táctil               |
| Disparar | Mantener Espacio o J    | Mantener el botón de hechizo |
| Pausar   | P, Escape o botón Pausa | Botón Pausa                  |
| Sonido   | Botón Sonido            | Botón Sonido                 |

Los controles táctiles permiten moverse y disparar al mismo tiempo. El área de juego se adapta a la pantalla y al cambio de orientación. La partida se pausa al cambiar de pestaña. El sonido comienza después de la primera interacción.

## Reglas

- Mishi empieza con 3 vidas y puede acumular hasta 7.
- Cada chispa recogida suma 10 puntos. Cada 300 puntos se recupera una vida.
- Los enemigos, proyectiles y rayos causan daño. Después de recibir un golpe hay 1,5 segundos de invulnerabilidad.
- Si escapan 3 criaturas, se pierde una vida.
- Leche mágica: escudo. Pez dorado: disparo triple. Ovillo estelar: atracción de chispas. Cada poder dura 8,5 segundos.
- Superar las cuatro primeras oleadas desbloquea el combate final. La Bruja Sombra tiene tres fases.
- Se gana al derrotar al jefe y se pierde al quedarse sin vidas.

## Niveles

1. El Bosque Encantado.
2. Mar de Nubes.
3. Tormenta Eléctrica.
4. Las Torres de Lunaris.
5. La Bruja Sombra.

## Organización

```text
index.html                Página principal
style.css                 Interfaz y diseño adaptable
src/
  main.js                 Configuración e inicio
  scenes/                 Carga, menú, partida y resultados
  objects/                Personaje y enemigos
  managers/               Guardado y ajuste de pantalla
  physics/                Reglas y parámetros de niveles
  ui/                     Menús, HUD y controles
  audio/                  Música y efectos con Web Audio
  assets/                 Imagen del personaje, gráficos y fuentes
vendor/                   Phaser y su licencia
tests/                    Pruebas de lógica
tools/server.cjs          Servidor de desarrollo
```

Arcade Physics controla el movimiento y las colisiones. Los proyectiles y estrellas se reutilizan para limitar la creación de objetos. Las escenas separan los estados del juego. Los scripts comparten el espacio de nombres `Mishi` y se cargan en el orden indicado en `index.html`.

## Guardado

`localStorage` conserva el récord, el capítulo desbloqueado y la configuración de sonido con la clave `mishi-lunaris-v1`. Continuar comienza en el capítulo guardado con 3 vidas y una puntuación nueva. El progreso pertenece a cada navegador y dirección web. Si el almacenamiento está bloqueado, la partida funciona con datos en memoria.

## Pruebas

```bash
npm test
```

Incluyen persistencia, movimiento, daño, poderes, progresión, jefe y ajuste de pantalla. Las pruebas de lógica no miden FPS ni sustituyen una prueba en el dispositivo de presentación. El objetivo de ejecución es 60 FPS.
