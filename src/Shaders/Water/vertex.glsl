uniform float uTime;
uniform float uBigWavesElevation;
uniform vec2 uBigWavesFrequency;
uniform float uBigWavesSpeed;
uniform float uSmallWavesElevation;
uniform float uSmallWavesFrequency;
uniform float uSmallWavesSpeed;
uniform float uSmallIterations;
uniform vec3 uShipPosition;
uniform float uShipRadius;

varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

#include  ../Includes/Noise.glsl

float wavesElevation(vec3 position)
{
    // Elevation
    float elevation = 
        sin(position.x * uBigWavesFrequency.x + uTime * uBigWavesSpeed) * 
        sin(position.z * uBigWavesFrequency.y + uTime * uBigWavesSpeed) * 
        uBigWavesElevation;

    for(float i = 1.0;  i <= uSmallIterations; i++)
    {
        elevation -= abs(cnoise(vec3(position.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)) * 
        uSmallWavesElevation / i );
    }

    // Ship
    float distanceToShip = length(position.xy - uShipPosition.xy);
    float shipInfluence = smoothstep(0.1, uShipRadius, uShipRadius - distanceToShip);

    elevation -= shipInfluence * uBigWavesElevation;

    return elevation;
}

void main()
{
    // Base position
    float shift = 0.01;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec3 modelPositionA = modelPosition.xyz + vec3(shift, 0.0, 0.0);
    vec3 modelPositionB = modelPosition.xyz + vec3(0.0, 0.0, - shift);

    // Elevation
    float elevation = wavesElevation(modelPosition.xyz);
    modelPosition.y += elevation;
    modelPositionA.y += wavesElevation(modelPositionA);
    modelPositionB.y += wavesElevation(modelPositionB);

    // Compute normal
    vec3 toA = normalize(modelPositionA - modelPosition.xyz);
    vec3 toB = normalize(modelPositionB - modelPosition.xyz);
    vec3 computedNormal = cross(toA, toB);

    // Final position
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Varyings
    vElevation = elevation;
    vNormal = computedNormal;
    vPosition = modelPosition.xyz;
}