/*
 *   Copyright (c) 2019, EPFL/Human Brain Project PCO
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

package services

import constants.{EditorClient, EditorConstants, ServiceClient}
import models.errors.APIEditorError
import models.instance.{EditorInstance, NexusInstance, NexusInstanceReference}
import models.{AccessToken, NexusPath}
import monix.eval.Task
import play.api.http.HeaderNames.AUTHORIZATION
import play.api.http.Status.{CREATED, NO_CONTENT, OK}
import play.api.libs.json.{JsObject, Json}
import play.api.libs.ws.{WSClient, WSResponse}

trait InstanceAPIService {
  val instanceEndpoint = "/api/instances"
  val internalInstanceEndpoint = "/internal/api/instances"

  def getInstances(
    wsClient: WSClient,
    apiBaseEndpoint: String,
    token: AccessToken,
    instanceIds: List[String],
    stage: String,
    metadata: Boolean,
    returnAlternatives: Boolean,
    returnPermissions: Boolean,
    clientToken: String
  ): Task[Either[WSResponse, JsObject]] = {
    val payload = Json.toJson(instanceIds)
    val q = wsClient
      .url(s"${apiBaseEndpoint}/instancesByIds")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
      .addQueryStringParameters(
        "stage"              -> stage,
        "metadata"           -> metadata.toString,
        "returnAlternatives" -> returnAlternatives.toString,
        "returnPermissions"  -> returnPermissions.toString
      )
    val r = Task.deferFuture(q.post(payload))
    r.map { res =>
      res.status match {
        case OK => Right(res.json.as[JsObject])
        case _  => Left(res)
      }
    }
  }

  def searchInstances(
    wsClient: WSClient,
    apiBaseEndpoint: String,
    from: Option[Int],
    size: Option[Int],
    typeId: String,
    searchByLabel: String,
    token: AccessToken,
    clientToken: String
  ): Task[Either[WSResponse, JsObject]] = {
    val q = wsClient
      .url(s"${apiBaseEndpoint}/instances")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
      .addQueryStringParameters(
        "stage"             -> "LIVE",
        "returnPermissions" -> "true",
        "type"              -> typeId,
        "searchByLabel"     -> searchByLabel
      )
    val r = Task.deferFuture(q.get())
    r.map { res =>
      res.status match {
        case OK => Right(res.json.as[JsObject])
        case _  => Left(res)
      }
    }
  }

  def getInstancesByType(
    wsClient: WSClient,
    apiBaseEndpoint: String,
    token: AccessToken,
    typeOfInstance: String,
    metadata: Boolean,
    clientToken: String
  ): Task[Either[WSResponse, JsObject]] = {
    val q = wsClient
      .url(s"${apiBaseEndpoint}/instances")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
      .addQueryStringParameters("type" -> typeOfInstance, "metadata" -> metadata.toString, "stage" -> "LIVE")
    val r = Task.deferFuture(q.get())
    r.map { res =>
      res.status match {
        case OK => Right(res.json.as[JsObject])
        case _  => Left(res)
      }
    }
  }

  def getGraph(
    wSClient: WSClient,
    apiBaseEndpoint: String,
    id: String,
    token: AccessToken,
    clientToken: String,
    clientExtensionId: Option[String] = None
  ): Task[Either[WSResponse, JsObject]] = {
    val params = clientExtensionId.map("clientIdExtension" -> _).getOrElse("" -> "")
    val q = wSClient
      .url(s"$apiBaseEndpoint/instances/${id}/graph")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
      .addQueryStringParameters("stage" -> "LIVE")
      .addQueryStringParameters(params)
    val r = Task.deferFuture(q.get())
    r.map { res =>
      res.status match {
        case OK =>
          Right(res.json.as[JsObject])
        case _ => Left(res)
      }
    }
  }

  def postSuggestions(
    wSClient: WSClient,
    apiBaseEndpoint: String,
    token: AccessToken,
    id: String,
    field: String,
    `type`: Option[String],
    start: Int,
    size: Int,
    search: String,
    payload: JsObject,
    clientToken: String
  ): Task[Either[WSResponse, JsObject]] = {
    val wsc = wSClient
      .url(s"$apiBaseEndpoint/instances/${id}/suggestedLinksForProperty")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
      .addQueryStringParameters(
        "property" -> field,
        "from"     -> start.toString,
        "size"     -> size.toString,
        "search"   -> search,
        "stage"    -> "LIVE"
      )
    val q = `type` match {
      case Some(t) => wsc.addQueryStringParameters("type" -> t)
      case _       => wsc
    }
    val r = Task.deferFuture(q.post(payload))
    r.map { res =>
      res.status match {
        case OK => Right(res.json.as[JsObject])
        case _  => Left(res)
      }
    }
  }

  def getInstance(
    wSClient: WSClient,
    apiBaseEndpoint: String,
    id: String,
    token: AccessToken,
    metadata: Boolean,
    returnPermissions: Boolean,
    clientToken: String
  ): Task[Either[WSResponse, JsObject]] = {
    val q = wSClient
      .url(s"$apiBaseEndpoint/instances/${id}")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
      .addQueryStringParameters(
        "stage"             -> "LIVE",
        "metadata"          -> metadata.toString,
        "returnPermissions" -> returnPermissions.toString
      )
    val r = Task.deferFuture(q.get())
    r.map { res =>
      res.status match {
        case OK =>
          Right(res.json.as[JsObject])
        case _ => Left(res)
      }
    }
  }

  def get(
    wSClient: WSClient,
    apiBaseEndpoint: String,
    nexusInstance: NexusInstanceReference,
    token: AccessToken,
    clientToken: String,
    clientExtensionId: Option[String] = None
  ): Task[Either[WSResponse, NexusInstance]] = {
    val params = clientExtensionId.map("clientIdExtension" -> _).getOrElse("" -> "")
    val q = wSClient
      .url(s"$apiBaseEndpoint$internalInstanceEndpoint/${nexusInstance.toString}")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
      .addQueryStringParameters(params)
    val r = Task.deferFuture(q.get())
    r.map { res =>
      res.status match {
        case OK =>
          Right(NexusInstance(Some(nexusInstance.id), nexusInstance.nexusPath, res.json.as[JsObject]))
        case _ => Left(res)
      }
    }
  }

  def put(
    wSClient: WSClient,
    apiBaseEndpoint: String,
    nexusInstance: NexusInstanceReference,
    editorInstance: EditorInstance,
    token: AccessToken,
    userId: String,
    clientToken: String
  ): Task[Either[WSResponse, Unit]] = {
    val q = wSClient
      .url(s"$apiBaseEndpoint$internalInstanceEndpoint/${nexusInstance.toString}")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
      .addQueryStringParameters("clientIdExtension" -> userId)

    val r = Task.deferFuture(q.put(editorInstance.nexusInstance.content))
    r.map { res =>
      res.status match {
        case OK | CREATED => Right(())
        case _            => Left(res)
      }
    }
  }

  def delete(
    wSClient: WSClient,
    apiBaseEndpoint: String,
    nexusInstance: NexusInstanceReference,
    token: AccessToken,
    clientToken: String
  ): Task[Either[WSResponse, Unit]] = {
    val q = wSClient
      .url(s"$apiBaseEndpoint$instanceEndpoint/${nexusInstance.toString}")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
    val r = Task.deferFuture(q.delete())
    r.map { res =>
      res.status match {
        case OK | NO_CONTENT => Right(())
        case _               => Left(res)
      }
    }
  }

  def deleteEditorInstance(
    wSClient: WSClient,
    apiBaseEndpoint: String,
    id: String,
    token: AccessToken,
    clientToken: String
  ): Task[Either[APIEditorError, Unit]] = {
    val q = wSClient
      .url(s"$apiBaseEndpoint/instances/${id}")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
    val r = Task.deferFuture(q.delete())
    r.map { res =>
      res.status match {
        case OK | NO_CONTENT => Right(())
        case _               => Left(APIEditorError(res.status, res.body))
      }
    }
  }

  def updateInstance(
    wSClient: WSClient,
    apiBaseEndpoint: String,
    id: String,
    body: JsObject,
    token: AccessToken,
    clientToken: String
  ): Task[Either[WSResponse, JsObject]] = {
    val q = wSClient
      .url(s"$apiBaseEndpoint/instances/${id}")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
    val r = Task.deferFuture(q.patch(body))
    r.map { res =>
      res.status match {
        case OK => Right(res.json.as[JsObject])
        case _  => Left(res)
      }
    }
  }

  def postNew(
    wSClient: WSClient,
    apiBaseEndpoint: String,
    id: Option[String],
    workspace: String,
    body: JsObject,
    token: AccessToken,
    clientToken: String
  ): Task[Either[WSResponse, JsObject]] = {
    val idRes = id.getOrElse("")
    val q = wSClient
      .url(s"$apiBaseEndpoint/instances/${idRes}")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
      .addQueryStringParameters("space" -> workspace)
    val r = Task.deferFuture(q.post(body))
    r.map { res =>
      res.status match {
        case OK | CREATED => Right(res.json.as[JsObject])
        case _            => Left(res)
      }
    }
  }

  // TODO: deprecate this one and use postNew
  def post(
    wSClient: WSClient,
    apiBaseEndpoint: String,
    nexusInstance: NexusInstance,
    user: Option[String],
    token: AccessToken,
    clientToken: String
  ): Task[Either[WSResponse, NexusInstanceReference]] = {
    val q = wSClient
      .url(s"$apiBaseEndpoint$internalInstanceEndpoint/${nexusInstance.nexusPath.toString()}")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
      .addQueryStringParameters("clientIdExtension" -> user.getOrElse(""))
    val r = Task.deferFuture(q.post(nexusInstance.content))
    r.map { res =>
      res.status match {
        case OK | CREATED =>
          Right(NexusInstanceReference.fromUrl((res.json \ EditorConstants.RELATIVEURL).as[String]))
        case _ => Left(res)
      }
    }
  }

  def getLinkingInstance(
    wSClient: WSClient,
    apiBaseEndpoint: String,
    from: NexusInstanceReference,
    to: NexusInstanceReference,
    linkingInstancePath: NexusPath,
    token: AccessToken,
    clientToken: String
  ): Task[Either[WSResponse, List[NexusInstanceReference]]] = {
    val q = wSClient
      .url(
        s"$apiBaseEndpoint$internalInstanceEndpoint/${to.toString}/links/${from.toString}/${linkingInstancePath.toString()}"
      )
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
    val r = Task.deferFuture(q.get())
    r.map { res =>
      res.status match {
        case OK => Right(res.json.as[List[NexusInstanceReference]])
        case _  => Left(res)
      }
    }
  }
}