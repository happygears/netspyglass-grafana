// this directives are taken from http://angular-dragdrop.github.io/angular-dragdrop/getting-started/
// NOTE !!! : $dragImage is removed because it caused some erros.

function determineEffectAllowed(e) {
    if (e.originalEvent) {
        e.dataTransfer = e.originalEvent.dataTransfer;
    }

    // Chrome doesn't set dropEffect, so we have to work it out ourselves
    if (
        typeof e.dataTransfer !== "undefined" &&
        e.dataTransfer.dropEffect === "none"
    ) {
        if (
            e.dataTransfer.effectAllowed === "copy" ||
            e.dataTransfer.effectAllowed === "move"
        ) {
            e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed;
        } else if (
            e.dataTransfer.effectAllowed === "copyMove" ||
            e.dataTransfer.effectAllowed === "copymove"
        ) {
            e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
        }
    }
}

export function uiDraggable($parse, $rootScope) {
    return function (scope, element, attrs) {
        var isDragHandleUsed = false,
            dragHandleClass,
            draggingClass = attrs.draggingClass || "on-dragging",
            dragTarget;

        element.attr("draggable", false);

        scope.$watch(attrs.uiDraggable, function (newValue) {
            if (newValue) {
                element.attr("draggable", newValue);
                element.bind("dragend", dragendHandler);
                element.bind("dragstart", dragstartHandler);
            } else {
                element.removeAttr("draggable");
                element.unbind("dragend", dragendHandler);
                element.unbind("dragstart", dragstartHandler);
            }
        });

        if (angular.isString(attrs.dragHandleClass)) {
            isDragHandleUsed = true;
            dragHandleClass = attrs.dragHandleClass.trim() || "drag-handle";

            element.bind("mousedown", function (e) {
                dragTarget = e.target;
            });
        }

        function dragendHandler(e) {
            if (e.originalEvent) {
                e.dataTransfer = e.originalEvent.dataTransfer;
            }

            setTimeout(function () {
                element.unbind("$destroy", dragendHandler);
            }, 0);
            var sendChannel = attrs.dragChannel || "defaultchannel";
            $rootScope.$broadcast("ANGULAR_DRAG_END", e, sendChannel);

            determineEffectAllowed(e);

            if (e.dataTransfer && e.dataTransfer.dropEffect !== "none") {
                if (attrs.onDropSuccess) {
                    var onDropSuccessFn = $parse(attrs.onDropSuccess);
                    scope.$evalAsync(function () {
                        onDropSuccessFn(scope, { $event: e });
                    });
                }
            } else if (e.dataTransfer && e.dataTransfer.dropEffect === "none") {
                if (attrs.onDropFailure) {
                    var onDropFailureFn = $parse(attrs.onDropFailure);
                    scope.$evalAsync(function () {
                        onDropFailureFn(scope, { $event: e });
                    });
                }
            }
            element.removeClass(draggingClass);
        }

        function setDragElement(e, dragImageElementId) {
            var dragImageElementFn;

            if (e.originalEvent) {
                e.dataTransfer = e.originalEvent.dataTransfer;
            }

            dragImageElementFn = $parse(dragImageElementId);

            scope.$apply(function () {
                var elementId = dragImageElementFn(scope, { $event: e }),
                    dragElement;

                if (!(elementId && angular.isString(elementId))) {
                    return;
                }

                dragElement = document.getElementById(elementId);

                if (!dragElement) {
                    return;
                }

                e.dataTransfer.setDragImage(dragElement, 0, 0);
            });
        }

        function dragstartHandler(e) {
            if (e.originalEvent) {
                e.dataTransfer = e.originalEvent.dataTransfer;
            }

            var isDragAllowed =
                !isDragHandleUsed ||
                dragTarget.classList.contains(dragHandleClass);

            if (isDragAllowed) {
                var sendChannel = attrs.dragChannel || "defaultchannel";
                var dragData = "";
                if (attrs.drag) {
                    dragData = scope.$eval(attrs.drag);
                }

                var dragImage = attrs.dragImage || null;

                element.addClass(draggingClass);
                element.bind("$destroy", dragendHandler);

                if (attrs.dragImageElementId) {
                    setDragElement(e, attrs.dragImageElementId);
                }

                var offset = { x: e.offsetX, y: e.offsetY };
                var transferDataObject = {
                    data: dragData,
                    channel: sendChannel,
                    offset: offset,
                };
                var transferDataText = angular.toJson(transferDataObject);

                e.dataTransfer.setData("text", transferDataText);
                e.dataTransfer.effectAllowed = "copyMove";

                if (attrs.onDragStart) {
                    var onDragStartFn = $parse(attrs.onDragStart);
                    scope.$evalAsync(function () {
                        onDragStartFn(scope, {
                            $event: e,
                        });
                    });
                }

                $rootScope.$broadcast(
                    "ANGULAR_DRAG_START",
                    e,
                    sendChannel,
                    transferDataObject
                );
            } else {
                e.preventDefault();
            }
        }
    };
}

export function uiOnDrop($parse, $rootScope) {
    return function (scope, element, attr) {
        var dragging = 0; //Ref. http://stackoverflow.com/a/10906204
        var dropChannel = attr.dropChannel || "defaultchannel";
        var dragChannel = "";
        var dragEnterClass = attr.dragEnterClass || "on-drag-enter";
        var dragHoverClass = attr.dragHoverClass || "on-drag-hover";
        var customDragEnterEvent = $parse(attr.onDragEnter);
        var customDragLeaveEvent = $parse(attr.onDragLeave);
        var uiOnDragOverFn = $parse(attr.uiOnDragOver);

        function calculateDropOffset(e) {
            var offset = {
                x: e.offsetX,
                y: e.offsetY,
            };
            var target = e.target;

            while (target !== element[0]) {
                offset.x = offset.x + target.offsetLeft;
                offset.y = offset.y + target.offsetTop;

                target = target.offsetParent;
                if (!target) {
                    return null;
                }
            }

            return offset;
        }

        function onDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault(); // Necessary. Allows us to drop.
            }

            if (e.stopPropagation) {
                e.stopPropagation();
            }

            if (attr.uiOnDragOver) {
                scope.$evalAsync(function () {
                    uiOnDragOverFn(scope, { $event: e, $channel: dropChannel });
                });
            }

            return false;
        }

        function onDragLeave(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }

            if (e.stopPropagation) {
                e.stopPropagation();
            }
            dragging--;

            if (dragging === 0) {
                scope.$evalAsync(function () {
                    customDragLeaveEvent(scope, {
                        $event: e,
                        $channel: dropChannel,
                    });
                });
                element.addClass(dragEnterClass);
                element.removeClass(dragHoverClass);
            }

            if (attr.uiOnDragLeave) {
                var uiOnDragLeaveFn = $parse(attr.uiOnDragLeave);
                scope.$evalAsync(function () {
                    uiOnDragLeaveFn(scope, {
                        $event: e,
                        $channel: dropChannel,
                    });
                });
            }
        }

        function onDragEnter(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }

            if (e.stopPropagation) {
                e.stopPropagation();
            }

            if (dragging === 0) {
                scope.$evalAsync(function () {
                    customDragEnterEvent(scope, {
                        $event: e,
                        $channel: dropChannel,
                    });
                });
                element.removeClass(dragEnterClass);
                element.addClass(dragHoverClass);
            }
            dragging++;

            if (attr.uiOnDragEnter) {
                var uiOnDragEnterFn = $parse(attr.uiOnDragEnter);
                scope.$evalAsync(function () {
                    uiOnDragEnterFn(scope, {
                        $event: e,
                        $channel: dropChannel,
                    });
                });
            }

            $rootScope.$broadcast("ANGULAR_HOVER", dragChannel);
        }

        function onDrop(e) {
            if (e.originalEvent) {
                e.dataTransfer = e.originalEvent.dataTransfer;
            }

            if (e.preventDefault) {
                e.preventDefault(); // Necessary. Allows us to drop.
            }
            if (e.stopPropagation) {
                e.stopPropagation(); // Necessary. Allows us to drop.
            }

            var sendData = e.dataTransfer.getData("text");
            sendData = angular.fromJson(sendData);

            var dropOffset = calculateDropOffset(e);

            var position = dropOffset
                ? {
                      x: dropOffset.x - sendData.offset.x,
                      y: dropOffset.y - sendData.offset.y,
                  }
                : null;

            determineEffectAllowed(e);

            var uiOnDropFn = $parse(attr.uiOnDrop);
            scope.$evalAsync(function () {
                uiOnDropFn(scope, {
                    $data: sendData.data,
                    $event: e,
                    $channel: sendData.channel,
                    $position: position,
                });
            });
            element.removeClass(dragEnterClass);
            dragging = 0;
        }

        function isDragChannelAccepted(dragChannel, dropChannel) {
            if (dropChannel === "*") {
                return true;
            }

            var channelMatchPattern = new RegExp(
                "(\\s|[,])+(" + dragChannel + ")(\\s|[,])+",
                "i"
            );

            return channelMatchPattern.test("," + dropChannel + ",");
        }

        function preventNativeDnD(e) {
            if (e.originalEvent) {
                e.dataTransfer = e.originalEvent.dataTransfer;
            }

            if (e.preventDefault) {
                e.preventDefault();
            }
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            e.dataTransfer.dropEffect = "none";
            return false;
        }

        var deregisterDragStart = $rootScope.$on(
            "ANGULAR_DRAG_START",
            function (_, e, channel, transferDataObject) {
                dragChannel = channel;

                var valid = true;

                if (!isDragChannelAccepted(channel, dropChannel)) {
                    valid = false;
                }

                if (valid && attr.dropValidate) {
                    var validateFn = $parse(attr.dropValidate);
                    valid = validateFn(scope, {
                        $drop: { scope: scope, element: element },
                        $event: e,
                        $data: transferDataObject.data,
                        $channel: transferDataObject.channel,
                    });
                }

                if (valid) {
                    element.bind("dragover", onDragOver);
                    element.bind("dragenter", onDragEnter);
                    element.bind("dragleave", onDragLeave);
                    element.bind("drop", onDrop);

                    element.addClass(dragEnterClass);
                } else {
                    element.bind("dragover", preventNativeDnD);
                    element.bind("dragenter", preventNativeDnD);
                    element.bind("dragleave", preventNativeDnD);
                    element.bind("drop", preventNativeDnD);

                    element.removeClass(dragEnterClass);
                }
            }
        );

        var deregisterDragEnd = $rootScope.$on("ANGULAR_DRAG_END", function () {
            element.unbind("dragover", onDragOver);
            element.unbind("dragenter", onDragEnter);
            element.unbind("dragleave", onDragLeave);

            element.unbind("drop", onDrop);
            element.removeClass(dragHoverClass);
            element.removeClass(dragEnterClass);

            element.unbind("dragover", preventNativeDnD);
            element.unbind("dragenter", preventNativeDnD);
            element.unbind("dragleave", preventNativeDnD);
            element.unbind("drop", preventNativeDnD);
        });

        scope.$on("$destroy", function () {
            deregisterDragStart();
            deregisterDragEnd();
        });

        attr.$observe("dropChannel", function (value) {
            if (value) {
                dropChannel = value;
            }
        });
    };
}
