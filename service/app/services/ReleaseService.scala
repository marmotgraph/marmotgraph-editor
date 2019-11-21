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

import com.google.inject.Inject
import helpers.InstanceHelper
import models.AccessToken
import models.errors.APIEditorError
import models.instance.NexusInstanceReference
import monix.eval.Task
import play.api.Logger
import play.api.libs.json.{JsObject, JsValue, Json}
import play.api.libs.ws.WSClient

trait ReleaseService {

  def retrieveReleaseStatus(
    instanceIds: List[String],
    releaseTreeScope: String,
    token: AccessToken
  ): Task[Either[APIEditorError, JsValue]]

  def retrieveInstanceRelease(id: String, token: AccessToken): Task[Either[APIEditorError, JsObject]]

  def releaseInstance(id: String, token: AccessToken): Task[Either[APIEditorError, Unit]]

  def unreleaseInstance(id: String, token: AccessToken): Task[Either[APIEditorError, Unit]]

}

class ReleaseServiceLive @Inject()(
  wSClient: WSClient,
  configuration: ConfigurationServiceLive,
  releaseAPIServiceLive: ReleaseAPIServiceLive
) extends ReleaseService {

  val logger = Logger(this.getClass)

  def retrieveReleaseStatus(
    instanceIds: List[String],
    releaseTreeScope: String,
    token: AccessToken
  ): Task[Either[APIEditorError, JsValue]] = {
    val result = releaseAPIServiceLive
      .getReleaseStatus(wSClient, configuration.kgCoreEndpoint, instanceIds, token, releaseTreeScope)
    result.map {
      case Right(ref) =>
        val r = (ref \ "data").as[List[Map[String, JsValue]]].map(field => InstanceHelper.normalizeIdOfField(field))
        Right(Json.toJson(r))
      case Left(res) => Left(APIEditorError(res.status, res.body))
    }
  }

  def retrieveInstanceRelease(id: String, token: AccessToken): Task[Either[APIEditorError, JsObject]] = {
    val result = releaseAPIServiceLive
      .getRelease(wSClient, configuration.kgQueryEndpoint, id, token)
    result.map {
      case Right(ref) => Right(ref)
      case Left(res)  => Left(APIEditorError(res.status, res.body))
    }
  }

  def releaseInstance(id: String, token: AccessToken): Task[Either[APIEditorError, Unit]] = {
    val result = releaseAPIServiceLive
      .putReleaseInstance(wSClient, configuration.kgQueryEndpoint, id, token)
    result.map {
      case Right(()) => Right(())
      case Left(res) => Left(APIEditorError(res.status, res.body))
    }
  }

  def unreleaseInstance(id: String, token: AccessToken): Task[Either[APIEditorError, Unit]] = {
    val result = releaseAPIServiceLive
      .deleteRelease(wSClient, configuration.kgQueryEndpoint, id, token)
    result.map {
      case Right(()) => Right(())
      case Left(res) => Left(APIEditorError(res.status, res.body))
    }
  }

}