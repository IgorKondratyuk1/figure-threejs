import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { SceneUtils } from 'three/examples/jsm/utils/SceneUtils.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import VertexNormalsHelper from 'three/examples/jsm/helpers/VertexNormalsHelper';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

// once everything is loaded, we run our Three.js stuff.
function init() {

    var stats = initStats();

    // create a scene, that will hold all our elements such as objects, cameras and lights.
    var scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffee93 ); //0xfec994
    const axesHelper = new THREE.AxesHelper( 500 );
    scene.add( axesHelper );
    var plane = new THREE.GridHelper(300, 300);
    plane.material.color = new THREE.Color('white');
    scene.add(plane);
    // create a camera, which defines where we're looking at.
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    // create a render and set the size
    var webGLRenderer = new THREE.WebGLRenderer();
    webGLRenderer.setClearColor(new THREE.Color(0xEEEEEE, 1.0));
    webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    let orbitControls = new OrbitControls( camera, webGLRenderer.domElement );

    // position and point the camera to the center of the scene
    camera.position.x = -30;
    camera.position.y = 40;
    camera.position.z = 50;
    camera.lookAt(new THREE.Vector3(10, 0, 0));

    // add the output of the renderer to the html element
    document.getElementById("WebGL-output").appendChild(webGLRenderer.domElement);

    // the points group
    var spGroup;
    // the mesh
    var latheMesh;

    //generatePoints(12, 2, 2 * Math.PI);

    // setup the control gui
    var controls = new function () {
        // we need the first child, since it's a multimaterial

        this.segments = 12;
        this.phiStart = 0;
        this.phiLength = 2 * Math.PI;
        this.exportSpline = function exportSpline() {

            const strplace = [];
            console.log(splineHelperObjects[0].position);
            for ( let i = 0; i < splinePointsLength; i ++ ) {
        
                const p = splineHelperObjects[ i ].position;
                strplace.push( `new THREE.Vector3(${p.x}, ${p.y}, ${p.z})` );
        
            }
        
            console.log( strplace.join( ',\n' ) );
            const code = '[' + ( strplace.join( ',\n\t' ) ) + ']';
            prompt( 'copy and paste code', code );
        
        };
        this.redraw = function () {
            scene.remove(spGroup);
            scene.remove(latheMesh);
            generatePoints(controls.segments, controls.phiStart, controls.phiLength);
        };
    };

    var gui = new dat.GUI();
    gui.add(controls, 'segments', 0, 50).step(1).onChange(controls.redraw);
    gui.add(controls, 'phiStart', 0, 2 * Math.PI).onChange(controls.redraw);
    gui.add(controls, 'phiLength', 0, 2 * Math.PI).onChange(controls.redraw);
    gui.add(controls, 'exportSpline' );


    //________________________________________________________________________________//
    let pointsArr = [];
    var height = 5;
    var count = 30;
    for (var i = 0; i < count; i++) {
        //points.push(new THREE.Vector3((Math.sin(i * 0.2) + Math.cos(i * 0.3)) * height + 12, i, ( i - count ) + count / 2));
        pointsArr.push(new THREE.Vector3((Math.sin(i * 0.04) + Math.cos(i * 0.25)) * height + 4, i, ( i - count ) + count / 2));
    }
    var curveCR = new THREE.CatmullRomCurve3(pointsArr);
    var points = curveCR.getPoints(30);
    var geometry = new THREE.BufferGeometry().setFromPoints( points );
    var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    
    //Крива
    var curveObject = new THREE.Line( geometry, material );
    curveObject.userData.name = 'CurveHitBox'; // TEST
    curveObject.userData.drag = true;
    scene.add(curveObject);

    // Точки
    var pointsOfCurve = new THREE.Points(geometry, new THREE.PointsMaterial({
        size: 0.9,
        color: "blue"
    }));
    scene.add(pointsOfCurve);


    var latheGeometry = new THREE.LatheGeometry(points, 10, 0, 2 * Math.PI);
    latheMesh = createMesh(latheGeometry);
    scene.add(latheMesh);




    // var raycaster = new THREE.Raycaster();
    // raycaster.params.Points.threshold = 0.25;
    // var mouse = new THREE.Vector2();
    // var intersects = null;
    // var plane = new THREE.Plane();
    // var planeNormal = new THREE.Vector3();
    // var currentIndex = null;
    // var planePoint = new THREE.Vector3();
    // var dragging = false;

    // window.addEventListener("mousedown", mouseDown, false);
    // window.addEventListener("mousemove", mouseMove, false);
    // window.addEventListener("mouseup", mouseUp, false);

    // function mouseDown(event) {
    //     setRaycaster(event);
    //     getIndex();
    //     dragging = true;
    // }

    // function mouseMove(event) {
    // if (dragging && currentIndex !== null) {
    //     setRaycaster(event);
    //     raycaster.ray.intersectPlane(plane, planePoint);
    //     geometry.attributes.position.setXYZ(currentIndex, planePoint.x, planePoint.y, planePoint.z);
    //     geometry.attributes.position.needsUpdate = true;
    // }
    // }

    // function mouseUp(event) {
    // dragging = false;
    // currentIndex = null;
    // }

    // function getIndex() {
    // intersects = raycaster.intersectObject(points);
    // if (intersects.length === 0) {
    //     currentIndex = null;
    //     return;
    // }
    // currentIndex = intersects[0].index;
    // setPlane(intersects[0].point);
    // }

    // function setPlane(point) {
    // planeNormal.subVectors(camera.position, point).normalize();
    // plane.setFromNormalAndCoplanarPoint(planeNormal, point);
    // }

    // function setRaycaster(event) {
    // getMouse(event);
    // raycaster.setFromCamera(mouse, camera);
    // }

    // function getMouse(event) {
    // mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    // mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    // }





    //________________________________________________________________________________//


    render();

    function generatePoints(segments, phiStart, phiLength) {
        // add 10 random spheres
        var points = [];
        var height = 5;
        var count = 30;
        for (var i = 0; i < count; i++) {
            //points.push(new THREE.Vector3((Math.sin(i * 0.2) + Math.cos(i * 0.3)) * height + 12, i, ( i - count ) + count / 2));
            points.push(new THREE.Vector3((Math.sin(i * 0.04) + Math.cos(i * 0.25)) * height + 4, i, ( i - count ) + count / 2));

        }


        spGroup = new THREE.Object3D();
        var material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: false});
        points.forEach(function (point) {
            
            var spGeom = new THREE.SphereGeometry(0.2);
            var spMesh = new THREE.Mesh(spGeom, material);
            spMesh.position.copy(point);
            spGroup.add(spMesh);
        });

        // add the points as a group to the scene
        scene.add(spGroup);

        // use the same points to create a LatheGeometry
        var latheGeometry = new THREE.LatheGeometry(points, segments, phiStart, phiLength);
        latheMesh = createMesh(latheGeometry);
        scene.add(latheMesh);
    }

    function createMesh(geom) {

        // assign two materials
        //  var meshMaterial = new THREE.MeshBasicMaterial({color:0x00ff00, transparent:true, opacity:0.6});
        var meshMaterial = new THREE.MeshNormalMaterial();
        meshMaterial.side = THREE.DoubleSide;
        var wireFrameMat = new THREE.MeshBasicMaterial();
        wireFrameMat.wireframe = true;

        // create a multimaterial
        var mesh = SceneUtils.createMultiMaterialObject(geom, [meshMaterial, wireFrameMat]);
        return mesh;
    }

    function render() {
        stats.update();
        //spGroup.rotation.x = step;
        //latheMesh.rotation.x = step += 0.01;

        requestAnimationFrame(render);
        webGLRenderer.render(scene, camera);
    }

    function initStats() {

        var stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms

        // Align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';

        document.getElementById("Stats-output").appendChild(stats.domElement);

        return stats;
    }

}


function Curve( vectorsArray, handles, section ) {

    let curve = new THREE.CatmullRomCurve3( vectorsArray );
    curve.curveType = 'catmullrom';
    curve.tension = 0.55 ;

    let lineGeom = new THREE.BufferGeometry();

    let points = curve.getPoints(64);

    lineGeom.setFromPoints( points );

    let lineObj = new THREE.Line( lineGeom,
        new THREE.LineBasicMaterial({ color : 0xff00ff }) );

    
    let tube = new THREE.Mesh(
        new THREE.TubeBufferGeometry( curve, 64, 0.32 ),
        tubeMaterial
        );
    tube.name = 'line_helper';

    raycastList.push( tube );
    
    let obj = {
        curve,
        lineGeom,
        points,
        lineObj,
        tube,
        handles,
        type: "section_curve",
        section
    };

    obj.curve.section_curve = obj ;
    obj.tube.section_curve = obj ;
    obj.lineObj.section_curve = obj ;
    obj.handles.section_curve = obj ;
    obj.points.section_curve = obj ;


    for ( let i=0 ; i<obj.handles.length ; i++ ) {
        obj.handles[i].section_curves.push( obj ) ;
    };

    return obj ;

};





window.onload = init;