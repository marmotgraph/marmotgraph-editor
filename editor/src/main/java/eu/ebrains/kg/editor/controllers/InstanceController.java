package eu.ebrains.kg.editor.controllers;

import eu.ebrains.kg.editor.models.HasId;
import eu.ebrains.kg.editor.models.KGCoreResult;
import eu.ebrains.kg.editor.models.ResultWithOriginalMap;
import eu.ebrains.kg.editor.models.commons.UserSummary;
import eu.ebrains.kg.editor.models.instance.*;
import eu.ebrains.kg.editor.models.workspace.StructureOfField;
import eu.ebrains.kg.editor.models.workspace.StructureOfType;
import eu.ebrains.kg.editor.services.ReleaseClient;
import eu.ebrains.kg.editor.services.UserClient;
import eu.ebrains.kg.editor.services.WorkspaceClient;
import org.apache.commons.lang3.SerializationUtils;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class InstanceController {
    private final WorkspaceClient workspaceClient;
    private final ReleaseClient releaseClient;
    private final IdController idController;
    private final UserClient userClient;

    public InstanceController(WorkspaceClient workspaceClient, ReleaseClient releaseClient, IdController idController, UserClient userClient) {
        this.workspaceClient = workspaceClient;
        this.releaseClient = releaseClient;
        this.idController = idController;
        this.userClient = userClient;
    }

    public InstanceFull enrichInstance(ResultWithOriginalMap<InstanceFull> instanceWithMap) {
        InstanceFull instance = idController.simplifyId(instanceWithMap.getResult());
        Map<String, KGCoreResult<StructureOfType>> typesByName = getTypesByName(instance);
        enrichTypesAndFields(instance, instanceWithMap.getOriginalMap(), typesByName);
        enrichAlternatives(instance);
        return instance;
    }

    public Map<String, InstanceFull> enrichInstances(Map<String, ResultWithOriginalMap<InstanceFull>> instancesWithMap) {
        Collection<ResultWithOriginalMap<InstanceFull>> instancesWithResult = getInstancesWithSimplifiedId(instancesWithMap);
        Map<String, KGCoreResult<StructureOfType>> typesByName = getTypesByName(instancesWithResult);
        instancesWithResult.forEach(instanceWithResult -> {
            Map<String, KGCoreResult<StructureOfType>> filteredTypes = getFilteredTypes(typesByName, instanceWithResult.getResult());
            enrichTypesAndFields(instanceWithResult.getResult(), instanceWithResult.getOriginalMap(), filteredTypes);
            enrichAlternatives(instanceWithResult.getResult());
        });
        return instancesWithResult.stream().collect(Collectors.toMap(k -> k.getResult().getId(), ResultWithOriginalMap::getResult));
    }

    public Map<String, InstanceLabel> enrichInstancesLabel(Map<String, ResultWithOriginalMap<InstanceLabel>> instancesWithMap) {
        Collection<ResultWithOriginalMap<InstanceLabel>> instancesWithResult = getInstancesWithSimplifiedId(instancesWithMap);
        Map<String, KGCoreResult<StructureOfType>> typesByName = getTypesByName(instancesWithResult);
        instancesWithResult.forEach(instanceWithResult -> {
            Map<String, KGCoreResult<StructureOfType>> filteredTypes = getFilteredTypes(typesByName, instanceWithResult.getResult());
            enrichName(instanceWithResult.getResult(), instanceWithResult.getOriginalMap(), filteredTypes);
        });
        return instancesWithResult.stream().collect(Collectors.toMap(k -> k.getResult().getId(), ResultWithOriginalMap::getResult));
    }


    public Map<String, InstanceSummary> enrichInstancesSummary(Map<String, ResultWithOriginalMap<InstanceSummary>> instancesWithMap) {
        Collection<ResultWithOriginalMap<InstanceSummary>> instancesWithResult = getInstancesWithSimplifiedId(instancesWithMap);
        Map<String, KGCoreResult<StructureOfType>> typesByName = getTypesByName(instancesWithResult);
        instancesWithResult.forEach(instanceWithResult -> {
            Map<String, KGCoreResult<StructureOfType>> filteredTypes = getFilteredTypes(typesByName, instanceWithResult.getResult());
            enrichTypesAndSearchableFields(instanceWithResult.getResult(), instanceWithResult.getOriginalMap(), filteredTypes);
        });
        return instancesWithResult.stream().collect(Collectors.toMap(k -> k.getResult().getId(), ResultWithOriginalMap::getResult));
    }

    private <T extends HasId> Collection<ResultWithOriginalMap<T>> getInstancesWithSimplifiedId(Map<String, ResultWithOriginalMap<T>> instancesWithMap) {
        Collection<ResultWithOriginalMap<T>> instancesWithResult = instancesWithMap.values();
        instancesWithResult.forEach(i -> idController.simplifyId(i.getResult()));
        return instancesWithResult;
    }

    private Map<String, KGCoreResult<StructureOfType>> getFilteredTypes(Map<String, KGCoreResult<StructureOfType>> typesByName, InstanceLabel instance) {
        Map<String, KGCoreResult<StructureOfType>> result = new HashMap<>();
        instance.getTypes().forEach(t -> result.put(t.getName(), typesByName.get(t.getName())));
        return result;
    }

    public void enrichSimpleType(SimpleType t, Map<String, KGCoreResult<StructureOfType>> typesByName) {
        KGCoreResult<StructureOfType> structureOfTypeKGCoreResult = typesByName.get(t.getName());
        if (structureOfTypeKGCoreResult != null && structureOfTypeKGCoreResult.getData() != null) {
            t.setColor(structureOfTypeKGCoreResult.getData().getColor());
            t.setLabel(structureOfTypeKGCoreResult.getData().getLabel());
            t.setLabelField(structureOfTypeKGCoreResult.getData().getLabelField());
        }
    }

    private void simplifyIdsOfLinks(StructureOfField field, Map<?, ?> originalMap) {
        Object fromMap = originalMap.get(field.getFullyQualifiedName());
        if (fromMap instanceof Collection) {
            field.setValue(((Collection<?>) fromMap).stream().map(idController::simplifyIdIfObjectIsAMap));
        } else if (fromMap != null) {
            field.setValue(idController.simplifyIdIfObjectIsAMap(fromMap));
        }
    }

    /**
     * The editor UI expects a combined payload. This is why we recombine information of the instance with type information
     */
    private void enrichTypesAndFields(InstanceFull instance, Map<?, ?> originalMap, Map<String, KGCoreResult<StructureOfType>> typesByName) {
        if (typesByName != null) {
            // Fill the type information
            instance.getTypes().forEach(t -> enrichSimpleType(t, typesByName));

            // Define the fields with the structure of the type and the values of the instance
            List<StructureOfField> fields = typesByName.values().stream().map(KGCoreResult::getData).
                    filter(Objects::nonNull).map(t -> t.getFields().values()).
                    flatMap(Collection::stream).distinct().map(SerializationUtils::clone).collect(Collectors.toList());
            fields.forEach(f -> simplifyIdsOfLinks(f, originalMap));
            instance.setFields(convertFieldsToMap(fields));

            //Define special fields such as promoted and label
            instance.setPromotedFields(typesByName.values().stream().map(KGCoreResult::getData)
                    .filter(Objects::nonNull).map(StructureOfType::getPromotedFields).
                            flatMap(Collection::stream).distinct().collect(Collectors.toList()));
            instance.setLabelField(typesByName.values().stream().map(KGCoreResult::getData)
                    .filter(Objects::nonNull).map(StructureOfType::getLabelField).findFirst().orElse(null));
        }
    }

    private void enrichTypesAndSearchableFields(InstanceSummary instance, Map<?, ?> originalMap, Map<String, KGCoreResult<StructureOfType>> typesByName) {
        if (typesByName != null) {
            // Fill the type information
            instance.getTypes().forEach(t -> enrichSimpleType(t, typesByName));

            // Define the fields with the structure of the type and the values of the instance
            List<StructureOfField> fields = typesByName.values().stream().map(KGCoreResult::getData).
                    filter(Objects::nonNull).map(t -> t.getFields().values()).
                    flatMap(Collection::stream).distinct().map(SerializationUtils::clone).collect(Collectors.toList());

            List<String> promotedFields = typesByName.values().stream().map(KGCoreResult::getData)
                    .filter(Objects::nonNull).map(StructureOfType::getPromotedFields).
                            flatMap(Collection::stream).distinct().collect(Collectors.toList());
            List<StructureOfField> filteredFields = fields.stream().filter(f -> promotedFields.contains(f.getFullyQualifiedName())).collect(Collectors.toList());
            filteredFields.forEach(f -> simplifyIdsOfLinks(f, originalMap));
            instance.setFields(convertFieldsToMap(filteredFields));

            String labelField = typesByName.values().stream().map(KGCoreResult::getData)
                    .filter(Objects::nonNull).map(StructureOfType::getLabelField).findFirst().orElse(null);
            if (labelField != null) {
                String name = (String) originalMap.get(labelField);
                instance.setName(name);
            }
        }
    }

    private Map<String, StructureOfField> convertFieldsToMap(List<StructureOfField> fields) {
        return fields.stream().collect(Collectors.toMap(StructureOfField::getFullyQualifiedName, v -> v));
    }


    private void enrichName(InstanceLabel instance, Map<?, ?> originalMap, Map<String, KGCoreResult<StructureOfType>> typesByName) {
        if (typesByName != null) {
            // Fill the type information
            instance.getTypes().forEach(t -> enrichSimpleType(t, typesByName));

            //Set the name from the label field
            String labelField = typesByName.values().stream().map(KGCoreResult::getData)
                    .filter(Objects::nonNull).map(StructureOfType::getLabelField).findFirst().orElse(null);
            if (labelField != null) {
                String name = (String) originalMap.get(labelField);
                instance.setName(name);
            }
        }
    }

    private <T extends InstanceLabel> Map<String, KGCoreResult<StructureOfType>> getTypesByName(Collection<ResultWithOriginalMap<T>> instancesWithResult) {
        List<InstanceLabel> instanceLabelList = instancesWithResult.stream().map(ResultWithOriginalMap::getResult).collect(Collectors.toList());
        return getTypesByName(instanceLabelList);
    }

    private Map<String, KGCoreResult<StructureOfType>> getTypesByName(InstanceLabel instance) {
        List<String> involvedTypes = instance.getTypes().stream().map(SimpleType::getName).collect(Collectors.toList());
        return workspaceClient.getTypesByName(involvedTypes, true);
    }

    private Map<String, KGCoreResult<StructureOfType>> getTypesByName(List<InstanceLabel> instances) {
        Stream<SimpleType> simpleTypeStream = instances.stream().map(InstanceLabel::getTypes).flatMap(Collection::stream);
        List<String> involvedTypes = simpleTypeStream.map(SimpleType::getName).collect(Collectors.toList()).stream().distinct().collect(Collectors.toList());
        return workspaceClient.getTypesByName(involvedTypes, true);
    }

    /**
     * Normalize users of alternatives and add pictures
     */
    private void enrichAlternatives(InstanceFull instance) {
        Stream<UserSummary> allUsers = instance.getAlternatives().values().stream().flatMap(Collection::stream)
                .map(Alternative::getUsers).flatMap(Collection::stream);
        List<String> userIds = allUsers.map(u -> {
            UserSummary userSummary = idController.simplifyId(u);
            return userSummary.getId();
        }).filter(Objects::nonNull).distinct().collect(Collectors.toList());

        instance.getAlternatives().values().forEach(value -> value.forEach(v -> idController.simplifyIdIfObjectIsAMap(v.getValue())));

        /* TODO there's a lot of replication of big payloads here since we're keeping the picture in every sub element.
         *  Can't we just provide an additional map at the root level which is then looked up by the UI?
         */
        Map<String, String> userPictures = userClient.getUserPictures(userIds);
        instance.getAlternatives().values().stream().flatMap(Collection::stream)
                .map(Alternative::getUsers).flatMap(Collection::stream).forEach(u ->
                u.setPicture(userPictures.get(u.getId()))
        );
    }

    public void enrichNeighborRecursivelyWithTypeInformation(Neighbor neighbor) {
        Set<String> typesInNeighbor = findTypesInNeighbor(neighbor, new HashSet<>());
        Map<String, KGCoreResult<StructureOfType>> typesByName = workspaceClient.getTypesByName(new ArrayList<>(typesInNeighbor), true);
        enrichTypesInNeighbor(neighbor, typesByName);
    }

    private void enrichTypesInNeighbor(Neighbor neighbor, Map<String, KGCoreResult<StructureOfType>> types) {
        if (neighbor.getTypes() != null) {
            neighbor.getTypes().forEach(t -> enrichSimpleType(t, types));
        }
        if (neighbor.getInbound() != null) {
            neighbor.getInbound().forEach(i -> enrichTypesInNeighbor(i, types));
        }
        if (neighbor.getOutbound() != null) {
            neighbor.getOutbound().forEach(o -> enrichTypesInNeighbor(o, types));
        }
    }

    private static Set<String> findTypesInNeighbor(Neighbor neighbor, Set<String> acc) {
        if (neighbor.getTypes() != null) {
            acc.addAll(neighbor.getTypes().stream().map(SimpleType::getName).collect(Collectors.toSet()));
        }
        if (neighbor.getInbound() != null) {
            neighbor.getInbound().forEach(inboundNeighbor -> findTypesInNeighbor(inboundNeighbor, acc));
        }
        if (neighbor.getOutbound() != null) {
            neighbor.getOutbound().forEach(outboundNeighbor -> findTypesInNeighbor(outboundNeighbor, acc));
        }
        return acc;
    }


    public void enrichScopeRecursivelyWithTypeAndReleaseStatusInformation(Scope scope) {
        Set<String> types = new HashSet<>();
        Set<String> ids = new HashSet<>();
        findTypesAndIdsInScope(scope, types, ids);

        Map<String, KGCoreResult<StructureOfType>> typesByName = workspaceClient.getTypesByName(new ArrayList<>(types), true);
        enrichTypesInScope(scope, typesByName);

        Map<String, KGCoreResult<String>> releaseStatus = releaseClient.getReleaseStatus(new ArrayList<>(ids), "TOP_INSTANCE_ONLY");
        enrichReleaseStatusInScope(scope, releaseStatus);
    }

    private static void findTypesAndIdsInScope(Scope scope, Set<String> types, Set<String> ids) {
        types.addAll(scope.getTypes().stream().map(SimpleType::getName).collect(Collectors.toSet()));
        ids.add(scope.getId());
        if (scope.getChildren() != null) {
            scope.getChildren().forEach(s -> findTypesAndIdsInScope(s, types, ids));
        }
    }

    private void enrichReleaseStatusInScope(Scope scope, Map<String, KGCoreResult<String>> releaseStatus) {
        KGCoreResult<String> status = releaseStatus.get(scope.getId());
        scope.setStatus(status != null ? status.getData() : null);
        if (scope.getChildren() != null) {
            scope.getChildren().forEach(s -> enrichReleaseStatusInScope(s, releaseStatus));
        }
    }

    private void enrichTypesInScope(Scope scope, Map<String, KGCoreResult<StructureOfType>> types) {
        scope.getTypes().forEach(t -> enrichSimpleType(t, types));
        if (scope.getChildren() != null) {
            scope.getChildren().forEach(i -> enrichTypesInScope(i, types));
        }
    }

}