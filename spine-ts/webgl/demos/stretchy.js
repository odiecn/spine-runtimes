var stretchyDemo = function(pathPrefix, loadingComplete) {
	var COLOR_INNER = new spine.Color(0.8, 0, 0, 0.5);
	var COLOR_OUTER = new spine.Color(0.8, 0, 0, 0.8);
	var COLOR_INNER_SELECTED = new spine.Color(0.0, 0, 0.8, 0.5);
	var COLOR_OUTER_SELECTED = new spine.Color(0.0, 0, 0.8, 0.8);

	var canvas, gl, renderer, input, assetManager;
	var skeleton, bounds;		
	var lastFrameTime = Date.now() / 1000;
	var target = null;
	var kneeFront, kneeBack;
	var controlBones = ["front leg controller", "back leg controller", "hip"];
	var coords = new spine.webgl.Vector3(), temp = new spine.webgl.Vector3(), temp2 = new spine.Vector2(), temp3 = new spine.webgl.Vector3();
	var kneePos = new spine.Vector2();
	var playButton, timeLine, spacing, isPlaying = true, playTime = 0;		

	function init () {

		canvas = document.getElementById("stretchydemo-canvas");
		canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
		gl = canvas.getContext("webgl", { alpha: false }) || canvas.getContext("experimental-webgl", { alpha: false });	

		renderer = new spine.webgl.SceneRenderer(canvas, gl);
		assetManager = new spine.webgl.AssetManager(gl, pathPrefix);
		input = new spine.webgl.Input(canvas);
		input.addListener({
			down: function(x, y) {
				for (var i = 0; i < controlBones.length; i++) {	
					var bone = skeleton.findBone(controlBones[i]);				
					renderer.camera.screenToWorld(coords.set(x, y, 0), canvas.width, canvas.height);				
					if (temp.set(skeleton.x + bone.worldX, skeleton.y + bone.worldY, 0).distance(coords) < 20) {
						target = bone;
					}				
				}
			},
			up: function(x, y) {
				target = null;
			},
			dragged: function(x, y) {
				if (target != null) {
					renderer.camera.screenToWorld(coords.set(x, y, 0), canvas.width, canvas.height);
					if (target.parent !== null) {
						target.parent.worldToLocal(temp2.set(coords.x - skeleton.x, coords.y - skeleton.y));
						target.x = temp2.x;
						target.y = temp2.y;
					} else {
						target.x = coords.x - skeleton.x;
						target.y = coords.y - skeleton.y;
					}
				}
			},
			moved: function (x, y) { }
		})
		assetManager.loadTexture("stretchyman.png");
		assetManager.loadText("stretchyman.json");
		assetManager.loadText("stretchyman.atlas");
		requestAnimationFrame(load);
	}

	function load () {
		if (assetManager.isLoadingComplete()) {
			var atlas = new spine.TextureAtlas(assetManager.get("stretchyman.atlas"), function(path) {
				return assetManager.get(path);		
			});
			var atlasLoader = new spine.TextureAtlasAttachmentLoader(atlas);
			var skeletonJson = new spine.SkeletonJson(atlasLoader);
			var skeletonData = skeletonJson.readSkeletonData(assetManager.get("stretchyman.json"));
			skeleton = new spine.Skeleton(skeletonData);
			skeleton.setToSetupPose();
			skeleton.updateWorldTransform();
			var offset = new spine.Vector2();
			bounds = new spine.Vector2();
			skeleton.getBounds(offset, bounds);

			kneeFront = skeleton.findBone("front leg middle");
			kneeBack = skeleton.findBone("back leg middle");

			renderer.camera.position.x = offset.x + bounds.x / 2;
			renderer.camera.position.y = offset.y + bounds.y / 2;

			renderer.skeletonDebugRenderer.drawMeshHull = false;
			renderer.skeletonDebugRenderer.drawMeshTriangles = false;

			setupUI();

			loadingComplete(canvas, render);
		} else requestAnimationFrame(load);
	}

	function setupUI() {		
		var checkbox = $("#stretchydemo-drawbones");
		checkbox.change(function() {
			renderer.skeletonDebugRenderer.drawPaths = this.checked;
			renderer.skeletonDebugRenderer.drawBones = this.checked;			
		});
	}

	function centerKnee(kneeBone, hipBone, footBone) {
		temp.set(footBone.worldX + skeleton.x, footBone.worldY + skeleton.y, 0)
			.sub(temp3.set(hipBone.worldX + skeleton.x, hipBone.worldY + skeleton.y, 0));
		temp3.set(hipBone.worldX + skeleton.x, hipBone.worldY + skeleton.y, 0);
		temp.scale(0.5).add(temp3);
		kneeBone.parent.worldToLocal(kneePos.set(temp.x, temp.y));
		kneeBone.x = kneePos.x;
		kneeBone.y = kneePos.y;		
	}

	function render () {
		var now = Date.now() / 1000;
		var delta = now - lastFrameTime;
		lastFrameTime = now;
		if (delta > 0.032) delta = 0.032;		

		skeleton.updateWorldTransform();
		centerKnee(kneeBack, skeleton.findBone("back leg root"), skeleton.findBone("back leg controller"));
		centerKnee(kneeFront, skeleton.findBone("front leg root"), skeleton.findBone("front leg controller"));
		skeleton.updateWorldTransform();

		renderer.camera.viewportWidth = bounds.x * 1.2;
		renderer.camera.viewportHeight = bounds.y * 1.2;
		renderer.resize(spine.webgl.ResizeMode.Fit);

		gl.clearColor(0.2, 0.2, 0.2, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);			

		renderer.begin();				
		renderer.drawSkeleton(skeleton, true);
		renderer.drawSkeletonDebug(skeleton, false, ["root", "front leg middle", "back leg middle"]);
		for (var i = 0; i < controlBones.length; i++) {		
			var bone = skeleton.findBone(controlBones[i]);
			var colorInner = bone === target ? COLOR_INNER_SELECTED : COLOR_INNER;
			var colorOuter = bone === target ? COLOR_OUTER_SELECTED : COLOR_OUTER;
			renderer.circle(true, skeleton.x + bone.worldX, skeleton.y + bone.worldY, 20, colorInner);
			renderer.circle(false, skeleton.x + bone.worldX, skeleton.y + bone.worldY, 20, colorOuter);
		}
		renderer.end();				
	}

	init();
};