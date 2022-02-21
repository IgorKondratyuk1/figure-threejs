import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { SceneUtils } from 'three/examples/jsm/utils/SceneUtils.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper';
import { VertexTangentsHelper } from 'three/examples/jsm/helpers/VertexTangentsHelper';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';


function init() {

    let stats = initStats();

    let boxGeometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
    const splineHelperObjects = [];
    let splinePointsLength = 31;
    const positions = [];
    const point = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onUpPosition = new THREE.Vector2();
    const onDownPosition = new THREE.Vector2();

    let transformControl;
    const ARC_SEGMENTS = 200;
    const splines = {};

    // create a scene, that will hold all our elements such as objects, cameras and lights.
    let scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffee93 ); //0xfec994
    const axesHelper = new THREE.AxesHelper( 500 );
    scene.add( axesHelper );
    let plane = new THREE.GridHelper(300, 300);
    plane.material.color = new THREE.Color('white');
    scene.add(plane);
    // create a camera, which defines where we're looking at.
    let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    // create a render and set the size
    let webGLRenderer = new THREE.WebGLRenderer();
    webGLRenderer.setClearColor(new THREE.Color(0xEEEEEE, 1.0));
    webGLRenderer.setPixelRatio( window.devicePixelRatio );
    webGLRenderer.setSize(window.innerWidth, window.innerHeight);

    let orbitControls = new OrbitControls( camera, webGLRenderer.domElement );

    orbitControls.damping = 0.2;
    orbitControls.addEventListener( 'change', render );

    transformControl = new TransformControls( camera, webGLRenderer.domElement );
    transformControl.addEventListener( 'change', render );
    transformControl.addEventListener( 'dragging-changed', function ( event ) {

        orbitControls.enabled = ! event.value;

    } );
    scene.add( transformControl );

    transformControl.addEventListener( 'objectChange', function () {

        updateSplineOutline();

    } );

    document.addEventListener( 'pointerdown', onPointerDown );
    document.addEventListener( 'pointerup', onPointerUp );
    document.addEventListener( 'pointermove', onPointerMove );
    window.addEventListener( 'resize', onWindowResize );



    // position and point the camera to the center of the scene
    camera.position.x = 0;
    camera.position.y = window.innerWidth / window.innerHeight;
    camera.position.z = 100;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // add the output of the renderer to the html element
    document.getElementById("WebGL-output").appendChild(webGLRenderer.domElement);

    // the mesh
    let latheMesh;
    let latheGeometry;
    let normalsHelper;
    let newPoints;

    // setup the control gui
    let controls = new function () {
        // we need the first child, since it's a multimaterial

        this.segments = 12;
        this.phiStart = 0;
        this.phiLength = 2 * Math.PI;
        this.uniform =  true;
        this.exportSpline = function () {
            const result = [];
            for ( let i = 0; i < splinePointsLength; i ++ ) {
                //splineHelperObjects[i].position.z += 10;
                result.push(splineHelperObjects[i].position);
            }
            console.log(result);
            return result;
        };
        this.showNormals = function() {
            scene.remove(latheMesh);
            scene.remove(normalsHelper);
            newPoints = controls.exportSpline();
            generatePointsWithNormals(newPoints, controls.segments, controls.phiStart, controls.phiLength);
            render();
        }
        this.redraw = function () {
            scene.remove(latheMesh);
            scene.remove(normalsHelper);
            newPoints = controls.exportSpline();
            generatePoints(newPoints, controls.segments, controls.phiStart, controls.phiLength);
            render();
        };
    };

    let gui = new dat.GUI();
    gui.add(controls, 'segments', 0, 50).step(1).onChange(controls.redraw);
    gui.add(controls, 'phiStart', 0, 2 * Math.PI).onChange(controls.redraw);
    gui.add(controls, 'phiLength', 0, 2 * Math.PI).onChange(controls.redraw);
    gui.add(controls, 'showNormals');
    gui.add(controls, 'redraw');


    //________________________________________________________________________________//


    let pointsArr = [];
    let height = 5;
    let count = 30;
    for (let i = 0; i < count; i++) {
        //points.push(new THREE.Vector3((Math.sin(i * 0.2) + Math.cos(i * 0.3)) * height + 12, i, ( i - count ) + count / 2));
        pointsArr.push(new THREE.Vector3((Math.sin(i * 0.04) + Math.cos(i * 0.25)) * height + 4, i, ( i - count ) + count / 2));
        
    }

     let curveCR = new THREE.CatmullRomCurve3(pointsArr);
     let points = curveCR.getPoints(30);


    /*******
     * Curves
     *********/

    for ( let i = 0; i < splinePointsLength; i ++ ) {

        addSplineObject( positions[ i ] );

    }

    positions.length = 0;

    for ( let i = 0; i < splinePointsLength; i ++ ) {

        positions.push( splineHelperObjects[ i ].position );

    }

    boxGeometry = new THREE.BufferGeometry();
    boxGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ARC_SEGMENTS * 3 ), 3 ) );

    let curve = new THREE.CatmullRomCurve3( positions );
    curve.curveType = 'catmullrom';
    curve.mesh = new THREE.Line( boxGeometry.clone(), new THREE.LineBasicMaterial( {
        color: 0xff0000,
        opacity: 0.35
    } ) );
    splines.uniform = curve;


    for ( const k in splines ) {

        const spline = splines[ k ];
        scene.add( spline.mesh );

    }
    
    load(points);

    //________________________________________________________________________________//


    render();

    
    function generatePoints(points, segments, phiStart, phiLength) {

        scene.remove(latheMesh);
        scene.remove(normalsHelper);

        // use the same points to create a LatheGeometry
        latheGeometry = new THREE.LatheGeometry(points, segments, phiStart, phiLength);

        latheMesh = createMesh(latheGeometry);

        scene.add(latheMesh);
    }

    function generatePointsWithNormals(points, segments, phiStart, phiLength) {

        scene.remove(latheMesh);
        scene.remove(normalsHelper);

        // use the same points to create a LatheGeometry
        latheGeometry = new THREE.LatheGeometry(points, segments, phiStart, phiLength);

        let meshMaterial = new THREE.MeshNormalMaterial();
        meshMaterial.side = THREE.DoubleSide;
        latheMesh = new THREE.Mesh( latheGeometry, meshMaterial );

        latheGeometry.computeVertexNormals();
        normalsHelper = new VertexNormalsHelper( latheMesh, 5, 'lightgreen');
        
        scene.add(latheMesh);
        scene.add(normalsHelper);

    }

    function createMesh(geom) {

        // assign two materials
        let meshMaterial = new THREE.MeshNormalMaterial();
        meshMaterial.side = THREE.DoubleSide;
        let wireFrameMat = new THREE.MeshBasicMaterial();
        wireFrameMat.wireframe = true;

        // create a multimaterial
        let mesh = SceneUtils.createMultiMaterialObject(geom, [meshMaterial, wireFrameMat]);
        return mesh;
    }

    function render() {
        stats.update();
        //requestAnimationFrame(render);
        splines.uniform.mesh.visible = controls.uniform;
        webGLRenderer.render(scene, camera);
    }

    function initStats() {

        let stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms

        // Align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';

        document.getElementById("Stats-output").appendChild(stats.domElement);

        return stats;
    }




    function addSplineObject( position ) {

        const material = new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } );
        const object = new THREE.Mesh( boxGeometry, material );
    
        if ( position ) {
    
            object.position.copy( position );
    
        } else {
    
            object.position.x = Math.random() * 1000 - 500;
            object.position.y = Math.random() * 600;
            object.position.z = Math.random() * 800 - 400;
    
        }
    
        scene.add( object );
        splineHelperObjects.push( object );
        return object;
    
    }
    
    function addPoint() {
    
        splinePointsLength ++;
    
        positions.push( addSplineObject().position );
    
        updateSplineOutline();
    
        render();
    
    }

    function updateSplineOutline() {
        console.log('a');
        for ( const k in splines ) {
    
            const spline = splines[ k ];
    
            const splineMesh = spline.mesh;
            const position = splineMesh.geometry.attributes.position;
    
            for ( let i = 0; i < ARC_SEGMENTS; i ++ ) {
    
                const t = i / ( ARC_SEGMENTS - 1 );
                spline.getPoint( t, point );
                position.setXYZ( i, point.x, point.y, point.z );
    
            }
    
            position.needsUpdate = true;
    
        }
        let p = controls.exportSpline();
        generatePoints(p, controls.segments, controls.phiStart, controls.phiLength);
    }

    function load( new_positions ) {
        while ( new_positions.length > positions.length ) {
    
            addPoint();
    
        }
    
        for ( let i = 0; i < positions.length; i ++ ) {
    
            positions[ i ].copy( new_positions[ i ] );
    
        }
        updateSplineOutline();
    
    }

    function onPointerDown( event ) {

        onDownPosition.x = event.clientX;
        onDownPosition.y = event.clientY;
    
    }
    
    function onPointerUp(event) {
    
        onUpPosition.x = event.clientX;
        onUpPosition.y = event.clientY;
    
        if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) transformControl.detach();
    
    }
    
    function onPointerMove( event ) {
    
        pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
        raycaster.setFromCamera( pointer, camera );
    
        const intersects = raycaster.intersectObjects( splineHelperObjects, false );
    
        if ( intersects.length > 0 ) {
    
            const object = intersects[ 0 ].object;
    
            if ( object !== transformControl.object ) {
    
                transformControl.attach( object );
    
            }
    
        }
    
    }
    
    function onWindowResize() {
    
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    
        webGLRenderer.setSize( window.innerWidth, window.innerHeight );
        
        render();
    
    }

}

window.onload = init;